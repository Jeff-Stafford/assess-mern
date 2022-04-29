import urllib

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.core.mail import EmailMessage, send_mail
from django.core.urlresolvers import reverse
from django.db import transaction
from django.forms import HiddenInput
from django.forms.models import modelformset_factory, inlineformset_factory
from django.http import HttpResponse
from django.shortcuts import render, render_to_response, redirect, get_object_or_404
from django.template import Context
from django.template.loader import render_to_string, get_template
from django.utils.translation import ugettext as _
from django.views.decorators.csrf import requires_csrf_token
from django.views.decorators.http import *

from formtools.wizard.views import NamedUrlSessionWizardView

from manager import models, consts, tasks
from manager.utils import save_locations
from electiongis import models as gismodels, consts as gconsts
from electiongis.models import get_all_locations_as_choices

from manager import forms
from manager.utils import build_url

ELECTION_FORMS = [
    ('welcome', forms.WizardWelcomeForm),
    ('location', forms.WizardLocationForm),
    ('dates',   forms.WizardDatesForm),
    ('additional', forms.WizardAdditionalForm),
]


ELECTION_TEMPLATES = {
    'welcome': 'manager/wizard/welcome.html',
    'location': 'manager/wizard/location.html',
    'dates': 'manager/wizard/dates.html',
    'additional': 'manager/wizard/additional.html',
}


class ElectionWizard(NamedUrlSessionWizardView):

    # def dispatch(self, request, *args, **kwargs):
    #     if request.user.is_authenticated():
    #         return redirect('manager:elections')
    #     else:
    #         return super(ElectionWizard, self).dispatch(request, *args, **kwargs)

    def get_template_names(self):
        return [ELECTION_TEMPLATES[self.steps.current]]


    def get_form_kwargs(self, step=None):
        return {'request': self.request}

    def process_step(self, form):
        if self.steps.current == 'welcome':
            # check if user selected other state on the welcome screen
            # in that case we need to reset all selected locaions on the location page
            welcome_data = self.storage.get_step_data('welcome')
            location_data = self.storage.get_step_data('location')

            old_state = welcome_data and welcome_data.get('welcome-state')
            new_state = form and form.data and form.data.get('welcome-state')
            if old_state != new_state:
                # reset selected locations on the location page
                if location_data:
                    location_data.setlist('location-location', [])
                    self.storage.set_step_data('location', location_data)

                # pre-cache
                get_all_locations_as_choices(new_state)

        return self.get_form_step_data(form)

    def get_form_initial(self, step):
        if step == 'welcome' and self.request.user and self.request.user.is_authenticated and self.request.user.profile.state:
            return {'state': self.request.user.profile.state}

        return super(ElectionWizard, self).get_form_initial(step)


    def get_form(self, step=None, data=None, files=None):
        form = super(ElectionWizard, self).get_form(step, data, files)


        # determine the step if not given
        if step is None:
            step = self.steps.current

        if step == 'location':
            welcome_form = self.get_cleaned_data_for_step('welcome')
            if welcome_form:
                state = welcome_form['state']

                form.fields['location'].widget.data_url = build_url('api:ajax_election_locations', get={'state_id': state})
                form.fields['location'].choices = get_all_locations_as_choices(state)
            else:
                form.fields['location'].widget.data_url = build_url('api:ajax_election_locations')
                form.fields['location'].choices = ()
                # form.fields['location'].widget.choices  = get_all_locations_as_choices(state)

            # remove contact fields for authenticated user
            if self.request.user.is_authenticated:
                form.fields['contact_email'].required = False
                form.fields['contact_phone'].required = False

        elif step == 'additional':
            if not self.request.user.is_authenticated:
                form.fields['use_default_elections_website'].initial = False
                form.fields['use_default_elections_website'].required = False
                form.fields['use_default_elections_website'].widget = HiddenInput()

            else:
                location_form = self.get_cleaned_data_for_step('location')

                raw_locations = []
                if location_form:
                    raw_locations = [l.split('.')[1] for l in location_form['location']]

                contact_emails = models.Election.objects.get_contact_emails_by_locations(raw_locations)
                form.fields['contact_email'].widget.data_url = reverse('api:ajax_election_emails_by_locations', kwargs={
                    'locations': ','.join(raw_locations)
                })

                if location_form:
                    form.fields['contact_email'].initial = [location_form['contact_email']]

                form.fields['contact_email'].choices = [(email, email,) for email in contact_emails]

        return form


    def render_done(self, form, **kwargs):
        from collections import OrderedDict
        """
        This method gets called when all forms passed. The method should also
        re-validate all steps to prevent manipulation. If any form fails to
        validate, `render_revalidation_failure` should get called.
        If everything is fine call `done`.
        """
        final_forms = OrderedDict()
        # walk through the form list and try to validate the data again.
        for form_key in self.get_form_list():
            form_obj = self.get_form(step=form_key,
                data=self.storage.get_step_data(form_key),
                files=self.storage.get_step_files(form_key))
            if not form_obj.is_valid():
                messages.add_message(self.request, messages.WARNING, _('Please fill out this page'))
                return self.render_revalidation_failure(form_key, form_obj, **kwargs)

            final_forms[form_key] = form_obj

        # render the done view and reset the wizard before returning the
        # response. This is needed to prevent from rendering done with the
        # same data twice.
        done_response = self.done(final_forms.values(), form_dict=final_forms, **kwargs)
        self.storage.reset()
        return done_response


    def save_election_url(self, election, field, pk, form):
        if form[field]:
            u = models.URL(election=election, url_type=models.URLType.objects.get(pk=pk), url=form[field])
            u.save()


    def save_election_dates(self, election, field, simple_kind, dates_form, adv_form):
        mode = field+'_mode'
        if dates_form[mode] == 'simple' and dates_form[field]:  # don't save empty dates
            dt = models.ElectionDate(election=election,
                kind=simple_kind,
                date_type=models.ElectionDateType.objects.get(default=True),
                date=dates_form[field])
            dt.save()

        elif dates_form[mode] == 'advanced':
            for d in adv_form:
                if not d:   # ignore empty
                    continue

                if 'DELETE' in d and d['DELETE']:
                    continue

                if 'date' in d and not d['date'] and \
                   'time' in d and not d['time']:  # don't save empty dates
                    continue

                date_type = d['description']
                if not date_type:
                    date_type = models.ElectionDateType.objects.get(default=True)

                dt = models.ElectionDate(election=election,
                    kind=simple_kind,
                    date_type=date_type,
                    date=d['date'],
                    time=d['time'])
                dt.save()


    def save_election_date(self, election, field, kind, form):
        if not form[field]:  # don't save empty date
            return

        dt = models.ElectionDate(election=election,
            kind=kind,
            date_type=models.ElectionDateType.objects.get(default=True),
            date=form[field])
        dt.save()


    def send_activation_email(self, email_to, activation_url):
        tasks.send_activation_email.delay(email_to, activation_url)
        return

    @transaction.atomic(using='election_manager')
    def done(self, form_list, **kwargs):
        form_dict = kwargs.pop('form_dict', dict())

        welcome = form_dict['welcome'].cleaned_data
        location = form_dict['location'].cleaned_data
        datesForm = form_dict['dates']
        dates = datesForm.cleaned_data

        additional = form_dict['additional'].cleaned_data
        useremail = location['contact_email']
        userphone = location['contact_phone']

        if self.request.user.is_authenticated:
            user = self.request.user
            useremail = user.email
            userphone = user.profile.phone

            if not additional.get('use_user_email_as_contact_email', False):
                useremail = additional.get('contact_email')

        else:
            try:
                user = User.objects.get(username=useremail)
            except User.DoesNotExist:
                user = User.objects.create_user(useremail, useremail, is_active=False)
                user.profile.phone = userphone
                user.profile.save()

        election = models.Election(
            state_geoid=gismodels.State.objects.get(state_id=welcome['state']).geoid,
            user=user,
            title=dates['election_name'],
            contact_email=useremail,
            contact_phone=userphone,
            election_level=welcome['election_level'],
            election_type=dates['election_type'],
            election_day_registration_is_available=dates['election_day_registration_is_available'],
            use_overseas_dates_as_military_dates=dates['military_dates_same_as_overseas'],
            election_date=dates['election_date'],
            additional_information=additional['additional_information'],
            use_default_elections_website=additional['use_default_elections_website'],
            use_user_email_as_contact_email=additional['use_user_email_as_contact_email']
        )
        election.save()

        save_locations(election, location['location'])

        # save urls from additional page
        URLS = (
            ('elections_website',           1,),
            ('official_candidate_listing',  2,),
            ('sample_ballot_information',   3,),
        )
        for (field, pk) in URLS:
            self.save_election_url(election, field, pk, additional)

        def add_dates(all_dates):
            r = list()
            for date in all_dates:
                field, kind, form = date
                if dates["%s_mode" % field] == 'advanced':
                    r.append((field, kind, form.cleaned_data,))
                else:
                    r.append((field, kind, {},))
            return r

        # save domestic/overseas dates
        DATES = add_dates([
            ('domestic_registration_deadline', consts.ELECTION_DATE_DOMESTIC_REGISTRATION_DEADLINE, datesForm.domesticRegistrationDeadlineFormSet),
            ('domestic_request_deadline', consts.ELECTION_DATE_DOMESTIC_BALLOT_REQUEST_DEADLINE, datesForm.domesticRequestDeadlineFormSet),
            ('domestic_return_deadline', consts.ELECTION_DATE_DOMESTIC_BALLOT_RETURN_DEADLINE, datesForm.domesticReturnDeadlineFormSet),
            ('overseas_registration_deadline', consts.ELECTION_DATE_OVERSEAS_REGISTRATION_DEADLINE, datesForm.overseasRegistrationDeadlineFormSet),
            ('overseas_request_deadline', consts.ELECTION_DATE_OVERSEAS_BALLOT_REQUEST_DEADLINE, datesForm.overseasRequestDeadlineFormSet),
            ('overseas_return_deadline', consts.ELECTION_DATE_OVERSEAS_BALLOT_RETURN_DEADLINE, datesForm.overseasReturnDeadlineFormSet)
        ])

        for (field, kind, form) in DATES:
            self.save_election_dates(election, field, kind, dates, form)

        # save military dates
        if dates['military_dates_same_as_overseas'] == False:
            MILITARY_DATES = add_dates([
                ('military_registration_deadline', consts.ELECTION_DATE_MILITARY_REGISTRATION_DEADLINE, datesForm.militaryRegistrationDeadlineFormSet),
                ('military_request_deadline', consts.ELECTION_DATE_MILITARY_BALLOT_REQUEST_DEADLINE, datesForm.militaryRequestDeadlineFormSet),
                ('military_return_deadline', consts.ELECTION_DATE_MILITARY_BALLOT_RETURN_DEADLINE, datesForm.militaryReturnDeadlineFormSet)
            ])
            for (field, kind, form) in MILITARY_DATES:
                self.save_election_dates(election, field, kind, dates, form)

        SINGLE_DATE = (
            ('early_voting_from_date',       consts.ELECTION_DATE_EARLY_VOTING_FROM),
            ('early_voting_to_date',         consts.ELECTION_DATE_EARLY_VOTING_TO),
            ('in_person_absentee_from_date', consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_FROM),
            ('in_person_absentee_to_date',   consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_TO),
        )
        for (field, kind) in SINGLE_DATE:
            self.save_election_date(election, field, kind, dates)

        # save feedback
        feedback = models.Feedback(election=election, notes=additional['feedback'])
        feedback.save()

        if not user.is_active:
            self.send_activation_email(election.contact_email, user.profile.create_activation_link())
            return redirect('manager:election_added', election_id=election.id)
        else:
            messages.add_message(self.request, messages.INFO, "Your election has been added and is pending approval by our staff")
            return redirect('manager:elections')


def index(request):
    if request.user.is_authenticated and not request.GET.get('create', False):
        return redirect('manager:elections')

    return election_manager_wizard(request)

def wizard(request):
    return render(request, 'manager/wizard.html', {})

election_manager_wizard = ElectionWizard.as_view(ELECTION_FORMS, url_name='manager:election_manager_step') # , done_step_name='manager:finished'
