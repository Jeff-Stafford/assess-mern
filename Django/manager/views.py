import json
import collections
import datetime

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.core.mail import EmailMessage, send_mail
from django.core.urlresolvers import reverse
from django.db import transaction
from django.db.models import Q
from django.forms.models import modelformset_factory, inlineformset_factory
from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.shortcuts import render, render_to_response, redirect, get_object_or_404
from django.template import Context
from django.template.loader import render_to_string, get_template
from django.utils.translation import ugettext as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import requires_csrf_token
from django.views.decorators.http import *

from formtools.wizard.views import NamedUrlSessionWizardView

from app.helpers import create_paginator

from eod.forms import SearchForm

from eod.models import State
from manager import models, tasks, consts
from electiongis import models as gismodels
from electiongis.models import get_all_locations_as_choices

from manager import forms
from manager.shortener import *

from manager import filters as election_filters

logger = logging.getLogger(__name__)


def _create_elections_filter(query, from_results=False):
    if not query:
        return Q()

    if from_results:
        filters = Q(election__title__icontains=query)
    else:
        filters = Q(title__icontains=query)

    q = query.lower()
    for state in consts.STATES:
        state_geoid, accr, name = state
        if not state_geoid:
            continue
        if q in accr.lower() or q in name.lower():
            if from_results:
                filters |= Q(election__state_geoid=state_geoid.zfill(2))
            else:
                filters |= Q(state_geoid=state_geoid.zfill(2))
    return filters


@login_required
def dashboard(request):
    if 'reset' in request.GET:
        # reverse('search_view') + '?item=4'
        if request.GET.get('view') and request.GET.get('view') in ['list', 'detail']:
            return redirect(reverse('manager:elections') + '?view=' + request.GET.get('view'))
        else:
            return redirect('manager:elections')

    search_form = SearchForm(request.GET or None)
    query = None
    if search_form.is_valid():
        query = search_form['query'].value()
        if not query or query is None:
            search_form = SearchForm()

    try:
        state = gismodels.State.objects.get(geoid=request.user.profile.state)
    except gismodels.State.DoesNotExist:
        state = None

    filters = _create_elections_filter(query)
    # filters |= Q(locations__name=query)
    filters &= Q(election_status__in=[
        consts.ELECTION_STATUS_APPROVED,
        consts.ELECTION_STATUS_PENDING,
        consts.ELECTION_STATUS_ARCHIVED,])

    if not request.user.has_perm('manager.view_all_election'):
        filters &= Q(user=request.user)


    elections = models.Election.objects.filter(filters).order_by('-election_date').all()
    elections = elections.prefetch_related('locations').\
                          prefetch_related('urls').\
                          prefetch_related('urls__url_type').\
                          prefetch_related('dates').\
                          prefetch_related('dates__date_type').\
                          prefetch_related('election_level').\
                          prefetch_related('election_type')
    election_filter = election_filters.ElectionFilter(request.GET, elections)

    elections = create_paginator(request, election_filter.qs, 10)

    return render(request, 'manager/dashboard/dashboard.html', {
        'search_form': search_form,
        'election_filter_form': election_filter.form,
        'state': state,
        'states': __get_states(),
        'elections': elections,
        'show_search_results': query or request.GET.getlist('election_status') or request.GET.getlist('election_level') or request.GET.getlist('election_type')
    })


def election_added(request, election_id):
    election = get_object_or_404(models.Election, pk=election_id)
    election_short_url = request.build_absolute_uri(reverse('manager:election_show', kwargs={
        'public_election_id': election.get_public_election_id() }))

    return render(request, 'manager/election_added.html', {
        'election': election,
        'election_short_url': election_short_url
    })

@login_required
@requires_csrf_token
def election_results(request, election_id):
    election = get_object_or_404(models.Election, pk=election_id)
    return render(request, 'manager/election_results.html', {
        'states': __get_states(),
        'election': election,
        'election_id': election.id,
    })


@login_required
@requires_csrf_token
def election_download_history(request, election_id):
    election = get_object_or_404(models.Election, pk=election_id)

    filters = Q(elections_ids__contains='%s' % election_id)
    filters |= Q(election_result_attachment__election_result__election_id=election_id)

    download_history = create_paginator(request,
        models.ElectionResultDownloadHistory.objects.filter(filters, status='READY').order_by('-downloaded_at').all(),
        10)

    return render(request, 'manager/election_download_history.html', {
        'states': __get_states(),
        'election': election,
        'election_id': election.id,
        'download_history': download_history,
    })


@login_required
@permission_required('manager.view_election', raise_exception=True)
@requires_csrf_token
def create_or_update(request, election_id=None):

    # election
    if election_id:
        election = get_object_or_404(models.Election, pk=election_id)
    else:
        election = None

    # state
    state = None
    if election:
        state = election.get_election_state()

    if not state and request.user and request.user.profile.state:  # try user state
        try:
            state = gismodels.State.objects.get(geoid=request.user.profile.state)
        except gismodels.State.DoesNotExist:
            state = None
    form = forms.ElectionForm(request.POST or None, instance=election, state=state, request=request)
    domestic_reg_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_DOMESTIC_REGISTRATION_DEADLINE,   'domestic-reg-dates')
    domestic_req_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_DOMESTIC_BALLOT_REQUEST_DEADLINE, 'domestic-req-dates')
    domestic_sub_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_DOMESTIC_BALLOT_RETURN_DEADLINE,  'domestic-ret-dates')

    overseas_reg_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_OVERSEAS_REGISTRATION_DEADLINE,   'overseas-reg-dates')
    overseas_req_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_OVERSEAS_BALLOT_REQUEST_DEADLINE, 'overseas-req-dates')
    overseas_sub_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_OVERSEAS_BALLOT_RETURN_DEADLINE,  'overseas-ret-dates')

    military_reg_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_MILITARY_REGISTRATION_DEADLINE,   'military-reg-dates')
    military_req_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_MILITARY_BALLOT_REQUEST_DEADLINE, 'military-req-dates')
    military_sub_dates = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_MILITARY_BALLOT_RETURN_DEADLINE,  'military-ret-dates')

    early_voting_from = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_EARLY_VOTING_FROM, 'early-voting-from')
    early_voting_to = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_EARLY_VOTING_TO, 'early-voting-to')

    in_person_absentee_voting_from = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_FROM, 'in-person-absentee-voting-from')
    in_person_absentee_voting_to = forms.election_date_formset_factory(request, election, consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_TO, 'in-person-absentee-voting-to')

    feedback = forms.ElectionFeedbackFormset(request.POST or None, instance=election)
    urls= forms.ElectionURLFormSet(request.POST or None, instance=election)

    show_error_message = False
    if request.method == 'POST':
        if request.POST.get('delete') and election:
            if not request.user.has_perm('manager.delete_election'):
                raise PermissionDenied

            election_title = election.title
            election.delete()
            messages.add_message(request, messages.INFO, 'The «%s» election was successfully deleted.' % election_title)
            return redirect('manager:elections')

        elif form.is_valid():
            if not request.user.has_perm('manager.change_election'):
                raise PermissionDenied
            if election:
                new_election = form.save(commit=False)
            else:
                new_election = form.save(commit=True)
            # valid all election's dates
            dates_valid = True
            dates = (
                domestic_reg_dates, domestic_req_dates, domestic_sub_dates,
                overseas_reg_dates, overseas_req_dates, overseas_sub_dates,
                military_reg_dates, military_req_dates, military_sub_dates,
                early_voting_from, early_voting_to,
                in_person_absentee_voting_from, in_person_absentee_voting_to)
            for dt in dates:
                if not dt.is_valid():
                    dates_valid = False
                    break

            if dates_valid and feedback.is_valid() and urls.is_valid():
                for dt in dates:
                    dt.save()
                feedback.save()
                urls.save()
                new_election.save()

                if election:
                    messages.add_message(request, messages.INFO, 'The «%s» election was successfully updated.' % new_election.title)
                    return redirect('manager:election_update', election_id=new_election.id)
                else:
                    messages.add_message(request, messages.INFO, 'The «%s» election was successfully created.' % new_election.title)
                    return redirect('manager:election_update', election_id=new_election.id)
            else:
                show_error_message = True
        else:
            show_error_message = True

        if show_error_message:
            messages.add_message(request, messages.ERROR, 'Please correct the errors below.')

    return render(request, 'manager/election.html', {
        'state': state,
        'states': __get_states(),
        'form': form,

        'domestic_reg_dates': domestic_reg_dates,
        'domestic_req_dates': domestic_req_dates,
        'domestic_sub_dates': domestic_sub_dates,

        'overseas_reg_dates': overseas_reg_dates,
        'overseas_req_dates': overseas_req_dates,
        'overseas_sub_dates': overseas_sub_dates,

        'military_reg_dates': military_reg_dates,
        'military_req_dates': military_req_dates,
        'military_sub_dates': military_sub_dates,

        'early_voting_from': early_voting_from,
        'early_voting_to': early_voting_to,

        'in_person_absentee_voting_from': in_person_absentee_voting_from,
        'in_person_absentee_voting_to': in_person_absentee_voting_to,

        'feedback': feedback,
        'urls': urls,
        'election': election,
        'locations': election.locations.all(),
        'election_id': election.id if election else None,
    })


def show(request, public_election_id):
    election_id = decode_num(public_election_id)
    election = get_object_or_404(models.Election, pk=election_id)

    return render(request, 'manager/election_show.html', {
        'election': election,
        'election_short_url': request.build_absolute_uri(reverse('manager:election_show',
            kwargs={'public_election_id': public_election_id}))
    })


# Fix non form error messages
# There is no easy way to change non form errors:
# ie: Please submit 1 or more _forms_.
# but I want to show Please submit 1 or more _files_.
def _fix_formset_errors(formset):
    if formset._non_form_errors:
        for i in range(len(formset._non_form_errors)):
            msg = formset._non_form_errors[i]
            msg = msg.replace('forms', 'files')
            msg = msg.replace('form', 'file')
            formset._non_form_errors[i] = msg

def show_upload_form(request, public_election_id):
    election_id = decode_num(public_election_id)
    election = get_object_or_404(models.Election, pk=election_id)

    initial = {'election_id': election.pk}
    if request.user.is_authenticated:
        initial['upload_by_user'] = request.user

    election_result_form = forms.ElectionResult(request.POST or None, request.FILES or None, initial=initial, request=request)
    attachment_formset = forms.ElectionResultAttachmentFormSet(request.POST or None, request.FILES or None, prefix='attachment')
    attachment_formset_helper = forms.ElectionResultAttachmentFormSetHelper()

    if election_result_form.is_valid() and attachment_formset.is_valid():
        election_result = election_result_form.save(commit=False)
        election_result.election = election
        election_result.save()

        attachments = attachment_formset.save(commit=False)
        for i, attachment in enumerate(attachments):
            attachment.election_result = election_result
            attachment.original_filename = attachment_formset[i].cleaned_data['file'].name
        attachment_formset.save()

        # get email from session r from uploader info
        email_to = election_result.uploader_email
        if not email_to and request.user.is_authenticated:
            email_to = request.user.email

        # collect all election by user
        elections = []
        filters = Q(contact_email=election_result.uploader_email)
        if request.user.is_authenticated:
            filters |= Q(user=request.user)

        for e in models.Election.objects.filter(filters).all():
            elections.append(dict(title=e.title, date=e.election_date.strftime("%B %d, %Y")))

        # schedule email
        tasks.send_thank_you_for_election_results_email.delay('Election Official',
            email_to, election_result.created_at.strftime("%B %d, %Y"), elections)

        messages.add_message(request, messages.INFO, "The election results were successfully uploaded.")
        return HttpResponseRedirect(request.path)


    _fix_formset_errors(attachment_formset)

    return render(request, 'manager/election_show_upload_form.html', {
        'election': election,
        'form': election_result_form,
        'attachment_formset': attachment_formset,
        'attachment_formset_helper': attachment_formset_helper,
        'election_short_url': request.build_absolute_uri(reverse('manager:election_show',
            kwargs={'public_election_id': public_election_id}))
    })


def _load_elections(query=None):
    # Load all elections and related election results
    # sorted by recent election result entity

    elections = []
    total_elections = 0
    election_ids = collections.OrderedDict()
    election_to_idx = {}

    state_name = None

    filters = _create_elections_filter(query, True)

    for er in models.ElectionResult.objects.filter(filters).values('pk', 'election_id').order_by('-created_at').all():
        election_id, election_result_id = er['election_id'], er['pk']
        if election_id in election_to_idx:
            election_idx = election_to_idx[election_id]['election_idx']
            election_to_idx[election_id]['result_to_idx'][election_result_id] = len(elections[election_idx]['results'])
            elections[election_idx]['results'].append(election_result_id)
        else:
            elections.append(dict(election=election_id, results=[election_result_id]))
            result_to_idx = dict()
            result_to_idx[election_result_id] = 0
            election_to_idx[election_id] = dict(election_idx=total_elections, result_to_idx=result_to_idx)

            election_ids[election_id] = True
            total_elections += 1

    # replace ids by entities
    # - replace election_id -> election
    # - replace election_result_id -> election_result
    elections_ids = election_ids.keys()
    for election in models.Election.objects.prefetch_related('results').filter(pk__in=elections_ids).all():

        election_idx = election_to_idx[election.id]['election_idx']

        elections[election_idx]['election'] = election
        elections[election_idx]['total_result_files'] = 0
        for result in election.results.all():
            result_idx = election_to_idx[election.id]['result_to_idx'][result.id]
            elections[election_idx]['results'][result_idx] = result
            elections[election_idx]['total_result_files'] += len(result.attachments.all())

    return (elections_ids, elections,)


@login_required
@permission_required(['manager.view_election', 'manager.view_electionresult'], raise_exception=True)
def elections_results_list(request):
    search_form = SearchForm(request.GET or None)
    query = None
    if search_form.is_valid():
        query = search_form['query'].value()
        if not query or query is None:
            search_form = SearchForm()

    elections_ids, elections = _load_elections(query)
    page_elections = create_paginator(request, elections, 3)
    ctx = {
        'states': __get_states(),
        'search_form': search_form,
        'elections_ids': elections_ids,
        'page_elections_ids': [e['election'].id for e in page_elections],
        'elections': page_elections,
    }

    return render(request, 'manager/elections_results_list.html', ctx)


@login_required
@permission_required(['manager.view_election', 'manager.send_request'], raise_exception=True)
def election_send_request_for_results(request, election_id):
    election = get_object_or_404(models.Election, pk=election_id)
    election.request_email_was_sent += 1
    election.request_email_was_sent_at = datetime.datetime.now()
    election.save()

    if not election.contact_email:
        logger.error("Election pk={0} has no contact_email and user.email".format(election.id))
        messages.add_message(request, messages.ERROR,
            '<p>Request email for election results has not been sent.</p>' +
            '<p>The «%s» election does not include a contact email or the election\'s user is not defined.</p>' & election.title)

    for email in [e for e in [election.contact_email, election.admin_email] if e]:
        tasks.send_asking_for_election_results_email.delay(
            election.title,
            reverse('manager:election_show_upload_form', kwargs={'public_election_id': election.get_public_election_id()}),
            'Election Official',
            email)

    messages.add_message(request, messages.INFO,
        '<p>Request email for election results has been sent.</p>')

    return HttpResponseRedirect(reverse('manager:elections'))


@login_required
@permission_required(['manager.view_election', 'manager.add_electionresultdownloadhistory'], raise_exception=True)
def election_results_download_link(request, era_id):
    election_result_attachment = get_object_or_404(models.ElectionResultAttachment, pk=era_id)

    # create download record
    erdh = models.ElectionResultDownloadHistory()
    erdh.status = 'READY'
    erdh.downloaded_at = datetime.datetime.now()
    erdh.downloaded_by_user = request.user
    erdh.election_result_attachment = election_result_attachment
    erdh.save()

    # redirect to real file
    return HttpResponseRedirect(election_result_attachment.file.url)


@login_required
@permission_required(['manager.view_election', 'manager.add_electionresultdownloadhistory'], raise_exception=True)
def ajax_generate_download_link_for_elections(request):
    if request.is_ajax() and request.method == 'POST':

        data = json.loads(request.body.decode('utf-8'))
        logger.debug('ajax_generate_download_link_for_elections=%s', data)
        elections_ids = data['elections_ids']
        if not elections_ids:
            data = dict(status='ERROR', error='elections_ids is required')
            return HttpResponse(json.dumps(data), content_type='application/json')

        # make sure that all elections exists
        for election_id in elections_ids:
            logger.debug(election_id)
            get_object_or_404(models.Election, pk=election_id)

        erdh = models.ElectionResultDownloadHistory()
        erdh.status = 'PENDING'
        erdh.elections_ids = elections_ids
        erdh.downloaded_at = datetime.datetime.now()
        erdh.downloaded_by_user = request.user
        erdh.save()

        tasks.create_election_results_archive.delay(erdh.pk)

        data = json.dumps({
            'id': erdh.pk,
            'elections_ids': erdh.elections_ids,
            'status': erdh.status,
            'error': erdh.error,
        })
        return HttpResponse(data, content_type='application/json')
    else:
        raise Http404

@login_required
@permission_required(['manager.view_election', 'manager.view_electionresultdownloadhistory'], raise_exception=True)
def ajax_check_download_link(request, erdh_id):
    if request.is_ajax():
        erdh = get_object_or_404(models.ElectionResultDownloadHistory, pk=erdh_id)
        data = {
            'id': erdh.pk,
            'elections_ids': erdh.elections_ids,
            'status': erdh.status,
            'error': erdh.error,
        }

        if erdh.status == 'READY':
            data['url'] = erdh.elections_archive_file.url

        return HttpResponse(json.dumps(data), content_type='application/json')
    else:
        raise Http404


@never_cache
def health_check(request):
    if request.GET.get('test_admin_emails', False):
        test_admin_emails__division_by_zero=2017/0  # ADMINS should receive email with the error

    now = datetime.datetime.now()
    return HttpResponse("%s" % now)


# @never_cache
# def health_check(request):
#     now = "%s" % datetime.datetime.now()
#     resp = HttpResponse(now, content_type="text/plain; charset=utf-8")
#     resp['Content-Length'] = len(now)
#     resp.write(now)
#     return resp


@login_required
@permission_required(['manager.view_election'], raise_exception=True)
def ajax_get_locations(request):

    if request.is_ajax():

        model_type = request.GET.get("model_type")
        state_fips = request.GET.get("state_fips")
        county_id  = request.GET.get("county_id")
        results    = []

        if not state_fips or model_type not in ["State", "County", "Place", "District"]:
            raise Http404

        if model_type == "State":
            for state in gismodels.State.objects.filter(fips = state_fips):
                state_json = {}
                state_json['geoid'] = state.geo_id2
                state_json['name'] = state.name
                results.append(state_json)

        elif model_type == 'County':
            for county in gismodels.County.objects.filter(state_id = state_fips).order_by('namelsad'):
                county_json = {}
                county_json['county_id'] = county.fips
                county_json['geoid'] = county.geo_id2
                county_json['name'] = county.namelsad
                results.append(county_json)

        elif model_type == 'District':

            for district in gismodels.SchoolDistrictElementary.objects.filter(state_id = state_fips).order_by('name'):
                district_json = {}
                district_json['geoid'] = district.geoid
                district_json['name'] = district.name
                results.append(district_json)
            for district in gismodels.SchoolDistrictSecondary.objects.filter(state_id = state_fips).order_by('name'):
                district_json = {}
                district_json['geoid'] = district.geoid
                district_json['name'] = district.name
                results.append(district_json)
            for district in gismodels.SchoolDistrictUnified.objects.filter(state_id = state_fips).order_by('name'):
                district_json = {}
                district_json['geoid'] = district.geoid
                district_json['name'] = district.name
                results.append(district_json)

        elif model_type == 'Place':

            county = gismodels.County.objects.filter(geoid = county_id).first()
            if not county:
                raise Http404

            for place in gismodels.Place.objects.filter(state_id = state_fips, county_id = county.fips).order_by('name'):
                place_json = {}
                place_json['county_id'] = place.county_id
                place_json['geoid'] = place.geo_id2
                place_json['name'] = place.name
                results.append(place_json)

        data = json.dumps(results)
        mimetype = 'application/json'
        return HttpResponse(data, mimetype)
    else:
        raise Http404


def __get_states():
    return list([(s.abbr, s.name, s.pk) for s in State.objects.order_by('abbr').all()])
