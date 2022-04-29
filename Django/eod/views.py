import gzip
import io

from collections import namedtuple, Sequence, defaultdict
from datetime import datetime
import logging

from django.contrib import messages
from django.contrib.auth.mixins import UserPassesTestMixin, PermissionRequiredMixin
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.db.models.sql.constants import QUERY_TERMS
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect, HttpResponseGone, FileResponse
from django.middleware import csrf
from django.shortcuts import get_object_or_404, redirect
from django.shortcuts import render
from django.views.generic import ListView, DetailView, UpdateView
from django.views.generic.base import View, TemplateView
from .merger import boolify_str, collect_processing_data, merge, get_change_type

from rest_framework import viewsets, mixins, permissions
from rest_framework.authentication import SessionAuthentication

from eod.serializers import (StateSerializer, \
    MunicipalitySerializer, CountySerializer, VotingRegionSerializer, \
    AddressSerializer, LocalOfficialSerializer, OfficerSerializer)

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from eod import models, phaseone_hacks, tasks, forms
from eod.forms import SearchForm, CorrectionFormSet, CorrectionForm, CORRECTION_STATUS_DEFAULT
from eod.forms import AddressForm, \
    OfficerFormSet, OfficerFormSetHelper, LocalOfficialForm, SubmitterForm, AddressFormSetHelper

from django.db.utils import IntegrityError

from app.helpers import create_paginator, set_address_usage, address_used_for

import eod.signals


logger = logging.getLogger(__name__)

Root = namedtuple('Root', 'general addresses officers')
Data = namedtuple('Data', 'type fields')

PAGINATE_PER_STATE = 200


class FilterMixin(object):

    def build_filters(self, filters=None):
        if filters is None:
            filters = {}

        orm_filters = {}
        for raw_filter_name in filters:
            filter_name = filter_op = None
            if '__' in raw_filter_name:
                filter_name, filter_op = raw_filter_name.split('__')
            else:
                filter_name = raw_filter_name

            if not filter_name in self.query_filters:
                continue  # unknown filter

            if filter_op and not filter_op in QUERY_TERMS and filter_op != 'ne':
                continue  # unknow query term

            filter_value = filters.get(raw_filter_name, None)
            if filter_value is None:
                continue
            orm_key = self.query_filters[filter_name]


            if filter_name.endswith('_name') and filter_op is None:
                filter_op = 'iexact'  # by default use case-insensetive search for field which ends with _name or _abbr


            if filter_name == 'office_type':
                office_type_values = {
                    'primary': '1',
                    'secondary': '2',
                    'additional': '3',
                }
                if not filter_value in office_type_values:
                    continue
                filter_value = office_type_values[filter_value]

            if filter_op:
                orm_filters['%s__%s' % (orm_key, filter_op)] = filter_value
            else:
                orm_filters[orm_key] = filter_value

        return orm_filters


    def get_queryset(self):
        filters = self.build_filters(self.request.query_params)
        try:
            result = self.queryset.filter(**filters)
        except ValueError:
            result = {}

        return result


class HasAdminPermission(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_active and \
            self.request.user.is_superuser or self.request.user.is_staff


class EODApiPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user and request.user.has_perm('api.can_read_eod_api')

# TBD: Move all API views into api_views.py class
class EODViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = phaseone_hacks.APILimitOffsetPagination
    authentication_classes = (SessionAuthentication, phaseone_hacks.EODAuthentication,)
    permission_classes = (EODApiPermission,)


class StateViewSet(EODViewSet):
    queryset = models.State.objects.all()
    serializer_class = StateSerializer


class CountyViewSet(FilterMixin, EODViewSet):
    queryset = models.County.objects.select_related('state').all()
    serializer_class = CountySerializer

    query_filters = {
        'state': 'state',
        'name': 'name',
        'county_type': 'county_type',
    }


class MunicipalityViewSet(FilterMixin, EODViewSet):
    queryset = models.Municipality.objects.select_related('state', 'county').all()
    serializer_class = MunicipalitySerializer

    query_filters = {
        'state': 'state',
        'county': 'county',
        'name': 'name',
        'municipality_type': 'municipality_type',
    }


class VotingRegionViewSet(FilterMixin, EODViewSet):
    queryset = models.VotingRegion.objects.all().select_related('state', 'county', 'municipality')
    serializer_class = VotingRegionSerializer

    query_filters = {
        'municipality': 'municipality',
        'municipality_type': 'municipality__municipality_type',
        'municipality_name': 'municipality__name',
        'state': 'state',
        'state_name': 'state__name',
        'state_abbr': 'state__abbr',
        'county': 'county',
        'county_name': 'county__name',
        'region_name': 'name',
    }


class AddressViewSet(EODViewSet):
    queryset = models.Address.objects.all()
    serializer_class = AddressSerializer


class LocalOfficialViewSet(FilterMixin, EODViewSet):
    queryset = models.LocalOfficial.objects.select_related('region').all()
    serializer_class = LocalOfficialSerializer

    query_filters = {
        'region_id': 'region_id',
        'region': 'region_id'
    }


class OfficerViewSet(FilterMixin, EODViewSet):
    queryset = models.Officer.objects.prefetch_related('local_official').all()
    serializer_class = OfficerSerializer

    query_filters = {
        'office_id': 'local_official',
        'office': 'local_official',
        'office_type': 'order_number'
    }


class CorrectionList(PermissionRequiredMixin, HasAdminPermission, ListView):
    model = models.LocalOfficialCorrection
    paginate_by = PAGINATE_PER_STATE

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )


    def _get_correction_status(self):
        correction_status = self.request.GET.get('status', None)
        if not models.CorrectionStatus.has(correction_status) or correction_status == 'all':
            correction_status = None
        return correction_status


    def get_queryset(self):
        correction_status = self._get_correction_status()
        qs = models.LocalOfficialCorrection.objects.select_related('local_official')
        if correction_status:
            qs = qs.filter(status=correction_status)
        return qs.all()

    def get_context_data(self, *args, **kwargs):
        ctx = super(CorrectionList, self).get_context_data(*args, **kwargs)
        ctx['correction_status'] = self._get_correction_status()
        ctx['states'] = list([(s.abbr, s.name, s.pk) for s in models.State.objects.order_by('abbr').all()])

        return ctx


class CorrectionListByStates(PermissionRequiredMixin, HasAdminPermission, TemplateView):
    paginate_by = 55
    template_name = 'eod/correction_list_by_states.html'

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def _get_download_url(self, state):
        task_id = cache.get('%s-local-officials' % state)
        if task_id:
            job = tasks.export_local_official_data.AsyncResult(task_id)
            if job.status == 'SUCCESS':
                return reverse('eod:download-exported-file', kwargs={'task_id': task_id})
        return None

    def get_context_data(self, *args, **kwargs):
        ctx = super(CorrectionListByStates, self).get_context_data(*args, **kwargs)

        results = defaultdict(list)
        for result in models.LocalOfficial.objects.select_related('region').values('region__state__abbr', 'id').order_by('region__state__abbr', 'id'):
            results[result['region__state__abbr']].append(result['id'])
        results

        states = []
        for s in models.State.objects.order_by('name').all():
            download_url = self._get_download_url(s.name.lower())
            states.append(dict(id=s.id, name=s.name,
                download_url=download_url,
                total_officials=len(results[s.abbr])))

        ctx['states_list'] = create_paginator(self.request, states, CorrectionListByStates.paginate_by)
        ctx['states'] = list([(s.abbr, s.name, s.pk) for s in models.State.objects.order_by('abbr').all()])
        ctx['all_states_download_url'] = self._get_download_url('all')

        return ctx


def create_correction(request, local_official):
    return models.LocalOfficialCorrection.objects.create(local_official=local_official,
        status=models.CorrectionStatus.INITIAL, user=request.user.pk, is_system=False)


def officer_recepient(request, local_official,  officer):
    return dict(correction_id=create_correction(request, local_official).pk, greeting=officer.office_name, to=officer.email)


def collect_recepients(request, local_official, emails=None, include_official=False, include_officers=False):
    if emails is None:
        emails = set()

    recepients = []
    if include_officers:
        for officer in local_official.officers.all():
            if not officer.email or officer.email in emails:  # ignore empty and duplicated emails
                continue
            emails.add(officer.email)
            recepients.append(officer_recepient(request, local_official, officer))

    return recepients


def collect_state_recepients(state_id, request, include_official=False, include_officers=False):
    recepients = []
    for local_official in models.LocalOfficial.objects.filter(region__state__pk=state_id).all():
        recepients.extend(collect_recepients(request, local_official,
            include_official=include_official,
            include_officers=include_officers))

    return recepients


class CorrectionStateList(PermissionRequiredMixin, HasAdminPermission, TemplateView):
    paginate_by = PAGINATE_PER_STATE
    template_name = 'eod/correction_list_by_state.html'

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def get_context_data(self, *args, **kwargs):
        ctx = super(CorrectionStateList, self).get_context_data(*args, **kwargs)

        state = get_object_or_404(models.State, pk=kwargs.get('pk'))

        ctx['state'] = state
        ctx['states'] = list([(s.abbr, s.name, s.pk) for s in models.State.objects.order_by('abbr').all()])

        officials = None
        filters = Q(region__state__pk=state.pk)
        officials = models.LocalOfficial.objects.prefetch_related('region', 'corrections')

        search_form = ctx['search_form'] = SearchForm(self.request.GET or None)
        if search_form.is_valid():
            query = search_form['query'].value()
            if query:
                query_filters = Q(region__name__icontains=query)
                query_filters |= Q(region__county__name__icontains=query)
                query_filters |= Q(region__municipality__name__icontains=query)

                query_filters |= Q(hours__icontains=query)
                query_filters |= Q(further_instruction__icontains=query)

                query_filters |= Q(officers__office_name__icontains=query)
                query_filters |= Q(officers__title__icontains=query)
                query_filters |= Q(officers__first_name__icontains=query)
                query_filters |= Q(officers__last_name__icontains=query)
                query_filters |= Q(officers__phone__icontains=query)
                query_filters |= Q(officers__fax__icontains=query)
                query_filters |= Q(officers__email__icontains=query)

                filters &= query_filters

                officials = officials.filter(filters).distinct()
        else:
            officials = officials.filter(filters)

        ctx['officials'] = create_paginator(self.request, list(officials.all()), CorrectionStateList.paginate_by)

        return ctx

    def get(self, request, *args, **kwargs):
        ctx = self.get_context_data(*args, **kwargs)
        return self.render_to_response(ctx)


    def post(self, request, *args, **kwargs):
        ctx = self.get_context_data(*args, **kwargs)

        if 'send-to-all-officials' in request.POST:
            include_official = 'include-official' in request.POST
            include_officers = 'include-officers' in request.POST
            if include_official or include_officers:
                recepients = collect_state_recepients(int(ctx['pk']), request,
                    include_official=include_official,
                    include_officers=include_officers)
                tasks.send_request_for_updates_email_to_recepients(recepients)
                if len(recepients) > 0:
                    messages.add_message(request, messages.INFO, "%d %s queued for delivery." %
                        (len(recepients), 'email was' if len(recepients) == 1 else 'emails were')
                    )
                else:
                    messages.add_message(request, messages.INFO, "No emails found.")
            else:
                messages.add_message(request, messages.WARNING,
                    "No emails have been sent. Please check at least one checkbox.")

        elif 'send-to-single-offical' in request.POST:
            local_official = get_object_or_404(models.LocalOfficial, pk=int(request.POST.get('send-to-single-offical')))
            recepients = collect_recepients(request, local_official)
            tasks.send_request_for_updates_email_to_recepients(recepients)
            messages.add_message(request, messages.INFO, "%d email was queued for delivery." % len(recepients))

        return redirect('eod:corrections-by-state', pk=int(ctx['pk']))


class LocalOfficialDetailRedirect(PermissionRequiredMixin, TemplateView):

    permission_required = ()

    def get(self, request, *args, **kwargs):
        ctx = self.get_context_data(*args, **kwargs)
        local_official = get_object_or_404(models.LocalOfficial, pk=ctx['pk'])
        return redirect('eod:public-submit-updates', local_official.corrections.last().request_id)


class LocalOfficialDetail(PermissionRequiredMixin, HasAdminPermission, TemplateView):
    template_name = 'eod/localofficial_detail.html'

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def get_context_data(self, *args, **kwargs):
        ctx = super(LocalOfficialDetail, self).get_context_data(*args, **kwargs)
        local_official = get_object_or_404(models.LocalOfficial, pk=ctx['pk'])
        ctx['local_official'] = local_official
        ctx['corrections'] = create_paginator(self.request, list(local_official.corrections.all()), 20)
        ctx['csrf_token'] = csrf.get_token(self.request)

        addresses = local_official.addresses.order_by('order_number').all()

        ctx['addresses'] = addresses

        ctx['form'] = LocalOfficialForm(self.request.POST or None, is_admin=True, instance=local_official)
        ctx['address_formset'] = forms.AddressFormset(self.request.POST or None, queryset=addresses, prefix='address')
        ctx['address_functions'] = models.Address.FUNCTIONS
        ctx['officer_form'] = forms.OfficerForm(None)
        ctx['officer_formset'] = forms.OfficerFormSet(self.request.POST or None, queryset=local_official.officers.order_by('order_number').all(), prefix='officer')
        ctx['states'] = list([(s.abbr, s.name, s.pk) for s in models.State.objects.order_by('abbr').all()])

        ctx['local_official_contacts'] = list([[s.pk, s.full_name()] for s in local_official.officers.order_by('order_number').all()])

        for idx, address in enumerate(ctx['addresses']):
            try:
                address.formset = next(formset for formset in ctx['address_formset'] if formset.initial['id'] == address.pk)
                address.contacts = list([[s.pk, s.full_name()] for s in address.officers.order_by('order_number').all()])
            except StopIteration:
                next

        ctx['address_formset_helper'] = AddressFormSetHelper()
        ctx['officer_formset_helper'] = OfficerFormSetHelper()
        ctx['admin_user'] = True
        ctx['last_updated'] = local_official.last_updated()
        ctx['officials'] = models.LocalOfficial.objects.filter(region__state__pk=local_official.region.state.pk)

        return ctx

    def _is_valid(self, ctx):
        return ctx['form'].is_valid() and \
            ctx['address_formset'].is_valid() and \
            ctx['officer_formset'].is_valid()


    def post(self, request, *args, **kwargs):

        if 'submit' in request.POST:

            ctx = self.get_context_data(*args, **kwargs)
            local_official = get_object_or_404(models.LocalOfficial, pk=ctx['pk'])

            if not self._is_valid(ctx):
                messages.add_message(self.request, messages.ERROR, '<strong>There was a problem with your submission.</strong><br/>Please correct the errors below and try again.')
            else:

                officer_mapper = {}
                for f in ctx['officer_formset']:

                    if any(f.cleaned_data) and f.cleaned_data['id'] is None: # new officer

                        data = {attr: f.cleaned_data[attr] for attr in f.cleaned_data if attr in forms.OfficerForm.Meta.fields }
                        if any(data):
                            data.update({"local_official": local_official})
                            officer = models.Officer(**data)
                            officer.touch()
                            officer.save()
                            if f.cleaned_data["nonpersistedid"]:
                                officer_mapper[f.cleaned_data["nonpersistedid"]] = officer

                    else: # update officer
                        data = {attr: f.cleaned_data[attr] for attr in f.cleaned_data if attr not in ["DELETE", "id", "nonpersistedid"] }

                        officer = get_object_or_404(models.Officer, pk=int(f.cleaned_data['id'].pk))
                        officer.touch()
                        officer.save()
                        models.Officer.objects.filter(pk=officer.pk).update(**data)


                if ctx['form'].has_changed():
                    lo = ctx['form'].save(commit=False)
                    lo.touch()
                    lo.save(update_fields=ctx['form'].changed_data)

                for idx, f in enumerate(ctx['address_formset']):

                    primary_contact_id = f.data.get("address-{}-primary_contact".format(idx))
                    if officer_mapper.get(primary_contact_id):
                        primary_contact = officer_mapper.get(primary_contact_id)
                    else:
                        if primary_contact_id is not None and len(primary_contact_id) > 0:
                            primary_contact = models.Officer.objects.get(pk=primary_contact_id)
                        else:
                            primary_contact = None


                    entity = f.cleaned_data.get('id')
                    if 'DELETE' in f.changed_data: # delete address
                        if entity is not None:
                            address = models.Address.objects.get(pk=entity.pk)
                            address.delete()
                        continue

                    if any(f.cleaned_data) and f.cleaned_data['id'] is None: # new address
                        data = {attr: f.cleaned_data[attr] for attr in f.changed_data if attr in forms.AddressForm.Meta.fields }
                        data.update({'functions': request.POST.getlist("address-{}-functions".format(idx))})
                        data.update({"local_official": local_official})

                        if any(data):
                            address = models.Address(**data)
                            ok, address = set_address_usage(request, address, idx)
                            if ok:
                                if primary_contact is not None:
                                    address.primary_contact = primary_contact
                                address.touch()
                                address.save()
                                for additional_contact_id in request.POST.getlist("address-{}-additional_contacts".format(idx)):
                                    if officer_mapper.get(additional_contact_id):
                                        contact = officer_mapper.get(additional_contact_id)
                                    else:
                                        contact = models.Officer.objects.get(pk=additional_contact_id)

                                    models.AddressOfficer(address=address, officer=contact).save()

                            else:
                                messages.add_message(self.request, messages.ERROR, address)


                    elif any(f.cleaned_data): # update address
                        data = {attr: f.cleaned_data[attr] for attr in f.changed_data if attr not in ["DELETE", "id"] }
                        data.update({"local_official": local_official})
                        data.update({'functions': request.POST.getlist("address-{}-functions".format(idx))})

                        address = get_object_or_404(models.Address, pk=entity.pk)
                        address.primary_contact = primary_contact
                        ok, address = set_address_usage(request, address, idx)
                        if ok:
                            address.touch()
                            address.save()
                            models.Address.objects.filter(pk=address.pk).update(**data)
                            models.AddressOfficer.objects.filter(address=address).delete()
                            for additional_contact_id in request.POST.getlist("address-{}-additional_contacts".format(idx)):
                                if officer_mapper.get(additional_contact_id):
                                    contact = officer_mapper.get(additional_contact_id)
                                else:
                                    contact = models.Officer.objects.get(pk=additional_contact_id)

                                models.AddressOfficer(address=address, officer=contact).save()

                        else:
                            messages.add_message(self.request, messages.ERROR, address)


                for f in ctx['officer_formset']:

                    if 'DELETE' in f.changed_data: # delete officer
                        entity = f.cleaned_data.get('id')
                        if entity is not None:
                            try:
                                officer = models.Officer.objects.get(pk=entity.pk)
                                officer.delete()
                            except:
                                pass
                        continue


                messages.add_message(request, messages.INFO, 'Local official has been updated.')
                return redirect('eod:local-official-detail', state_id = local_official.region.state.pk, pk = local_official.pk)

            return self.render_to_response(ctx)

        else:

            # this sends email to Officers with request for correction

            local_official = get_object_or_404(models.LocalOfficial, pk=int(request.POST.get('local-official')))
            include_official = request.POST.get('include-official')
            include_officers = request.POST.get('include-officers')

            if include_official or include_officers:
                recepients = collect_recepients(request, local_official,
                    include_official=include_official,
                    include_officers=include_officers)
                tasks.send_request_for_updates_email_to_recepients(recepients)
                if len(recepients) > 0:
                    messages.add_message(request, messages.INFO, "%d %s queued for delivery." %
                        (len(recepients), 'email was' if len(recepients) == 1 else 'emails were')
                    )
                else:
                    messages.add_message(request, messages.INFO, "No emails found.")
            else:
                messages.add_message(request, messages.WARNING, "Select at least one checkbox, if you want to send a request.")

            return redirect('eod:local-official-detail', state_id=local_official.region.state.id, pk=local_official.id)



@method_decorator(csrf_exempt, name='dispatch')
class CorrectionDetail(PermissionRequiredMixin, HasAdminPermission, UpdateView):
    model = models.LocalOfficialCorrection
    fields = ['local_official',]
    context_object_name = 'correction'

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )


    def get_context_data(self, *args, **kwargs):
        ctx = super(CorrectionDetail, self).get_context_data(*args, **kwargs)

        if self.object.status == models.CorrectionStatus.CORRECTION_SUBMITTED_UPDATES or \
           self.object.status == models.CorrectionStatus.CORRECTION_SUBMITTED_NO_UPDATES:
            ctx['submitter_form'] = SubmitterForm(initial=self.object.status_context['submitter'], read_only=True, prefix='submitter')

        ctx['states'] = list([(s.abbr, s.name, s.pk) for s in models.State.objects.order_by('abbr').all()])

        if self.object.status == models.CorrectionStatus.CORRECTION_SUBMITTED_UPDATES:

            scope = self.object.status_context

            local_official = models.LocalOfficial.objects.get(pk=self.object.status_context['object']['general']['id'])
            ctx['local_official'] = local_official
            ctx['local_official_contacts'] = list([[s.pk, s.full_name()] for s in local_official.officers.order_by('order_number').all()])
            ctx['address_functions'] = models.Address.FUNCTIONS

            corrected_officers = [{i: data} for i, data in enumerate(scope['correction']['officers'])]
            initial_officers = [{i: data} for i, data in enumerate(local_official.to_dict()['officers'])]
            officers = []
            max_index = len(initial_officers)

            officers = merge(scope['correction']['officers'], local_official.to_dict()['officers'])

            while max_index < len(corrected_officers): # when suggestion was to add officer(s)
                rhs = list(corrected_officers[max_index].values())[0]
                officers.extend([(None, rhs) + get_change_type(None, rhs)])
                max_index += 1

            ctx['officers'] = officers

            # addresses
            corrected_addresses = [{i: data} for i, data in enumerate(scope['correction']['addresses'])]
            initial_addresses = [{i: data} for i, data in enumerate(local_official.to_dict()['addresses'])]
            addresses = []
            max_index = len(initial_addresses)
            scope = self.object.status_context

            addresses = merge(scope['correction']['addresses'], local_official.to_dict()['addresses'])

            while max_index < len(corrected_addresses): # when suggestion was to add address(es)
                rhs = list(corrected_addresses[max_index].values())[0]
                addresses.extend([(None, rhs) + get_change_type(None, rhs)])
                max_index += 1

            ctx['addresses'] = addresses

            # general info
            if (scope['correction']['general']['further_instruction'] != local_official.to_dict()['general']['further_instruction']) or \
              (scope['correction']['general']['hours'] != local_official.to_dict()['general']['hours']):
                general_information_operation = {"operation": "Updates Submitted"}
            else:
                general_information_operation = {"operation": "No Updates Submitted"}

            general_information = [(scope['correction']['general'], local_official.to_dict()['general'], general_information_operation,)]

            ctx['general_information'] = general_information

        return ctx


    def post(self, request, *args, **kwargs):

        result = super(CorrectionDetail, self).post(request, *args, **kwargs)
        context = self.get_context_data()

        leo = self.object.local_official
        region_name = "%s, %s" % (leo.region.name, leo.region.state.name)

        data = collect_processing_data(request)

        if 'reject-correction' in request.POST:
            self.object.accept_corrections(False, {})
            self.object.save()
            messages.add_message(request, messages.INFO, 'We have successfully proccessed this correction.')
            return HttpResponseRedirect(reverse('eod:correction-detail', kwargs={'pk': self.object.pk}))

        officer_mapper = {}
        for officer in data["officers"]:
            attrs = {key: value for key, value in officer.items() if key not in ["add_record", "remove_record", "id", "nonpersistedid", "order_number"]}

            try:
                id = int(officer.get("id"))
            except:
                id = None

            if id:
                # update record
                leo.officers.filter(pk=officer.get("id")).update(**attrs)
            elif boolify_str(officer["add_record"]):
                o = models.Officer(**attrs)
                o.local_official = leo
                o.order_number = len(data["officers"])+1
                o.touch()
                o.save()
                officer_mapper[officer["nonpersistedid"]] = o


        for idx, address in enumerate(data["addresses"]):

            attrs = {key: value for key, value in address.items() if key not in ["add_record", "remove_record", "id", "additional_contact_ids"]}

            try:
                id = int(address.get("id"))
            except:
                id = None

            if id:

                # delete address record
                if address["remove_record"]:
                    leo.addresses.filter(pk=id).delete()
                    continue

                # update record
                address_obj = leo.addresses.filter(pk=id).first()

                if address_obj:
                    for key, value in attrs.items():
                        setattr(address_obj, key, value)

                    address_obj.state = leo.region.state.abbr

                    address_obj.is_regular_mail = address["is_regular_mail"]
                    address_obj.is_physical = address["is_physical"]
                    address_obj.main_email = address["main_email"]
                    address_obj.main_phone_number = address["main_phone_number"]
                    address_obj.main_fax_number = address["main_fax_number"]

                    if officer_mapper.get(address["primary_contact_id"]):
                        address_obj.primary_contact = officer_mapper.get(address["primary_contact_id"])

                    address_obj.touch()
                    try:
                        address_obj.save()
                    except ValueError:
                        pass

                    models.AddressOfficer.objects.filter(address=address_obj).delete()
                    for additional_contact_id in address["additional_contact_ids"]:
                        if officer_mapper.get(additional_contact_id):
                            models.AddressOfficer(address=address_obj, officer=officer_mapper.get(additional_contact_id)).save()
                        else:
                            models.AddressOfficer(address=address_obj, officer=models.Officer.objects.get(pk=additional_contact_id)).save()

            elif address["add_record"]:
                addr = models.Address(**attrs)
                addr.local_official = leo

                if officer_mapper.get(address["primary_contact_id"]):
                    addr.primary_contact = officer_mapper.get(address["primary_contact_id"])

                addr.touch()
                addr.state = leo.region.state.abbr
                addr.save()
                for additional_contact_id in address["additional_contact_ids"]:
                    if officer_mapper.get(additional_contact_id):
                        models.AddressOfficer(address=addr, officer=officer_mapper.get(additional_contact_id)).save()
                    else:
                        models.AddressOfficer(address=addr, officer=models.Officer.objects.get(pk=additional_contact_id)).save()


        for officer in data["officers"]:

            # remove officer
            try:
                id = int(officer.get("id"))
                if id and officer["remove_record"]:
                    for officer in leo.officers.filter(pk=id):
                        if (len(officer.officer_addresses.all()) == 0) and (leo.addresses.filter(primary_contact=officer).count() == 0):
                            officer.delete()
            except ValueError:
                pass


        leo.hours = data["general_information"]["hours"]
        leo.further_instruction = data["general_information"]["further_instruction"]
        leo.touch()
        leo.save()

        self.object.accept_corrections(True, {})
        self.object.save()
        messages.add_message(request, messages.INFO, 'We have have successfully proccessed this correction.')
        return HttpResponseRedirect(reverse('eod:correction-detail', kwargs={'pk': self.object.pk}))


class CorrectionHistoryDetail(PermissionRequiredMixin, HasAdminPermission, UpdateView):

    model = models.LocalOfficialCorrection
    fields = ['local_official',]
    context_object_name = 'correction'

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )


    def get_context_data(self, *args, **kwargs):
        ctx = super(CorrectionDetail, self).get_context_data(*args, **kwargs)

        return ctx


@method_decorator(csrf_exempt, name='dispatch')
class LocalOfficialOfficerSnapshot(PermissionRequiredMixin, HasAdminPermission, UpdateView):

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def post(self, request, *args, **kwargs):
        try:
            local_official = models.LocalOfficial.objects.get(pk=kwargs.get('local_official_id'))
            officer = models.Officer.objects.get(pk=kwargs.get('officer_id'))
            recipients = [officer_recepient(request, local_official, officer)]
            tasks.send_request_for_updates_email_to_recepients(recipients)
        except:
            return HttpResponse("{\"message\": \"Unable to complete your request\"}", status=400)

        return HttpResponse("{\"message\": \"Email has been scheduled for delivery\"}")


class PublicSubmitUpdates(PermissionRequiredMixin, UpdateView):
    model = models.LocalOfficial
    context_object_name = 'lo'

    template_name = 'eod/public_submit_updates.html'

    slug_field = 'request_id'
    slug_url_kwarg = 'request_id'

    form_class = LocalOfficialForm

    raise_exception = True
    permission_required = (
    )


    def _to_dict(self, ctx, request):

        correction = dict(
            general=ctx['form'].cleaned_data,
            addresses=ctx['address_formset'].cleaned_data,
            officers=ctx['officer_formset'].cleaned_data
        )

        officers = []
        for idx, data in enumerate(correction['officers']):
            if any(data):
                data.update({'index': idx})
                officers.append(data)
        officers = sorted(officers, key=lambda k: k['order_number'])

        correction['officers'] = officers

        addresses = []
        for idx, data in enumerate(correction['addresses']):
            if any(data):

                address_additional_contacts = []
                additional_contact_ids = request.POST.getlist('address-{}-additional_contacts'.format(idx))
                for id in additional_contact_ids:
                    try:
                        address_additional_contacts.append(models.Officer.objects.get(pk=int(id)).to_dict())
                    except ValueError:
                        # not existing officer
                        contact = next(officer for officer in officers if officer['nonpersistedid'] == id)
                        address_additional_contacts.append(contact)

                primary_contact_id = request.POST.get('address-{}-primary_contact'.format(idx))
                try:
                    address_primary_contact = models.Officer.objects.get(pk=int(primary_contact_id)).to_dict()
                except ValueError:
                    # not existing officer
                    # {'DELETE': False, 'id': None, 'last_name': '555', 'index': 1, 'fax': '', 'office_name': '555', 'order_number': 2,
                    # 'first_name': '555', 'nonpersistedid': 'nid-1', 'email': 'bkulbida@bear-code.com', 'phone': '555-567-4566'}
                    address_primary_contact = next(officer for officer in officers if officer['nonpersistedid'] == primary_contact_id)

                data.update({
                    'id': data.get('id').pk if data.get('id') else None,
                    'index': idx,
                    'functions': request.POST.getlist('address-{}-functions'.format(idx)),
                    'main_email': request.POST.get('address-{}-main_email'.format(idx)),
                    'main_phone_number': request.POST.get('address-{}-main_phone_number'.format(idx)),
                    'main_fax_number': request.POST.get('address-{}-main_fax_number'.format(idx)),
                    'additional_contacts': address_additional_contacts,
                    'primary_contact': address_primary_contact,
                    'is_regular_mail': address_used_for(request, idx)[0],
                    'is_physical': address_used_for(request, idx)[1],
                })
                addresses.append(data)

        addresses = sorted(addresses, key=lambda k: k['order_number'])
        correction['addresses'] = addresses

        updates = dict(
            object=ctx['original_object'],
            correction=correction,
            submitter=ctx['submitter_form'].cleaned_data
        )

        return updates


    def _get_local_official(self):
        return self.object.local_official


    def get_object(self, queryset=None):
        return super(PublicSubmitUpdates, self).get_object(queryset=models.LocalOfficialCorrection.objects.all())


    def get_context_data(self, *args, **kwargs):
        ctx = super(PublicSubmitUpdates, self).get_context_data(*args, **kwargs)

        local_official = self._get_local_official()
        ctx['lo'] = local_official
        ctx['local_official'] = local_official

        ctx['request_id'] = self.kwargs.get(self.slug_url_kwarg)

        posted_data = None
        if self.request.POST:
            posted_data = self.request.POST.copy()

        addresses = local_official.addresses.order_by('order_number').all()

        ctx['addresses'] = addresses
        ctx['address_formset'] = forms.AddressFormset(self.request.POST or None, queryset=addresses, prefix='address')
        ctx['form'] = LocalOfficialForm(posted_data, instance=local_official)

        ctx['address_functions'] = models.Address.FUNCTIONS
        ctx['officer_formset'] = OfficerFormSet(self.request.POST or None, queryset=local_official.officers.order_by('order_number').all(), prefix='officer')
        ctx['officer_form'] = forms.OfficerForm(None)
        ctx['local_official_contacts'] = list([[s.pk, s.full_name()] for s in local_official.officers.order_by('order_number').all()])

        ctx['officer_formset'] = OfficerFormSet(posted_data, queryset=local_official.officers.order_by('order_number').all(), prefix='officer')
        ctx['submitter_form'] = SubmitterForm(posted_data, prefix='submitter')

        if not self.request.POST:
            for idx, address in enumerate(addresses):
                address.formset = next(formset for formset in ctx['address_formset'] if formset.initial['id'] == address.pk)
                address.contacts = list([[s.pk, s.full_name()] for s in address.officers.order_by('order_number').all()])

        ctx['address_formset_helper'] = AddressFormSetHelper()
        ctx['officer_formset_helper'] = OfficerFormSetHelper()

        if posted_data:
            ctx['officer_formset'].full_clean()
            ctx['address_formset'].full_clean()
            ctx['submitter_form'].full_clean()

        return ctx


    def _is_valid(self, ctx):
        return ctx['form'].is_valid() and \
            ctx['officer_formset'].is_valid() and \
            ctx['address_formset'].is_valid() and \
            ctx['submitter_form'].is_valid()


    def form_valid(self, form):
        self._get_local_official().refresh_from_db()
        original_object = self._get_local_official().to_dict()
        ctx = self.get_context_data()
        ctx['original_object'] = original_object

        # logger.debug('form_valid context={}'.format(ctx))

        if self._is_valid(ctx) and not self._get_local_official().has_open_corrections():
            corr = self.object
            data = self._to_dict(ctx, self.request)

            if ctx['submitter_form'].cleaned_data['submission_type'] == 'Y':
                corr.correction_submitted_with_updates(data)
            else:
                corr.correction_submitted_without_updates(data)
                self._get_local_official().touch()
                self._get_local_official().save()

            corr.save()

            tasks.send_corrections_thank_you_email.delay(ctx['submitter_form'].cleaned_data['name'], ctx['submitter_form'].cleaned_data['email'])

            messages.add_message(self.request, messages.SUCCESS,
                '<h4>Thank you!</h4><p>Your information has been sent to an EOD content manager. Your request will be reviewed within 48 hours of submission before any changes are published to the site.</p>')

        else:
            print("Error form=", ctx['form'].errors)
            print("Error officer_formset=", ctx['officer_formset'].errors)
            print("Error submitter_form=", ctx['submitter_form'].errors)

            errors = [error_text for error_text in ctx['officer_formset'].errors if any(error_text)]

            if self._get_local_official().has_open_corrections():
                errors += ["Correction has been already submitted. Please try again later."]

            messages.add_message(self.request, messages.ERROR, 'Please correct the errors below and try again: {}'.format(errors))


        return redirect('eod:public-submit-updates', request_id=ctx['request_id'])


class LegacyPublicSubmitUpdates(PublicSubmitUpdates):

    slug_field = 'local_official__pk'
    slug_url_kwarg = 'local_official_id'


class ExportStates(PermissionRequiredMixin, View):

    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )


    def get(self, request, *args, **kwargs):
        async_result = tasks.export_local_official_data.delay(kwargs.get('pk', None))
        response = JsonResponse({
            'task_id': async_result.task_id,
            'task_status': async_result.status,
            'task_status_url': reverse('eod:export-status', kwargs={'task_id': async_result.task_id})
        })
        response.set_signed_cookie('fileDownload', value='true')
        return response


class ExportStatus(PermissionRequiredMixin, View):
    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def get(self, request, *args, **kwargs):
        job = tasks.export_local_official_data.AsyncResult(kwargs.get('task_id'))

        status = {'task_id': job.task_id, 'task_status': job.status}
        if job.status == 'PROGRESS':
            status['current'] = job.result['current']
            status['total'] = job.result['total']
        elif job.status == 'SUCCESS':
            status['download_url'] = reverse('eod:download-exported-file', kwargs={'task_id': job.task_id})
        elif job.status == 'FAILURE':
            status['error'] = str(job.result)

        return JsonResponse(status)


class DownloadExportedFile(PermissionRequiredMixin, View):
    raise_exception = True
    permission_required = (
        'eod.add_localofficialcorrection',
        'eod.change_localofficialcorrection',
        'eod.delete_localofficialcorrection',
        'eod.view_localofficialcorrection',
        'eod.add_localofficialcorrectionhistory',
        'eod.change_localofficialcorrectionhistory',
        'eod.delete_localofficialcorrectionhistory',
        'eod.view_localofficialcorrectionhistory',
    )

    def get(self, request, *args, **kwargs):
        job = tasks.export_local_official_data.AsyncResult(kwargs.get('task_id'))
        status = {'task_id': job.task_id, 'task_status': job.status}
        if job.status == 'SUCCESS':
            data = cache.get(job.task_id)
            if not data:
                return HttpResponseGone('Expired, try again.')

            decompressed_file = gzip.decompress(data)
            response = HttpResponse(decompressed_file, content_type='application/vnd.ms-excel')
            response['Content-Disposition'] = 'attachment; filename="%s"' % (job.result)
            return response

        return HttpResponseGone()

#@csrf_exempt
def docs(request):

    site_url = request.build_absolute_uri('/')
    api_suffix = '/eod/v3/'
    api_url = request.build_absolute_uri(api_suffix[0:-1])

    if request.user.is_authenticated:
        api_key = request.user.auth_token.key
    else:
        api_key = '<your_access_token>'

    from manager import consts

    url_parts = request.build_absolute_uri('').split('://')

    return render(request, 'api/EOD-API.html', {
        'site_url': site_url,
        'api_protocol': url_parts[0],
        'api_host': url_parts[1].split('/')[0],
        'api_url': api_url,
        'api_suffix': api_suffix,
        'api_key': api_key,
    })
