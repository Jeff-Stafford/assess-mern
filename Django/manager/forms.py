from itertools import chain

from django import forms
from django.core.urlresolvers import reverse
from django.forms import formset_factory, BaseInlineFormSet
from django.forms.models import inlineformset_factory, modelformset_factory

from phonenumber_field.formfields import PhoneNumberField

from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Fieldset, Div, Row, HTML, ButtonHolder, Submit, Button, MultiField
from crispy_forms.bootstrap import StrictButton, FormActions

from manager import consts
from manager.models import (Election, ElectionType, ElectionDate, ElectionDateType,
    ElectionLevel, URL, Location, Feedback, ElectionResult, ElectionResultAttachment)

from manager.utils import build_url, save_locations

from electiongis.models import State, get_all_locations_as_choices

from django_select2.forms import (
    HeavySelect2MultipleWidget, HeavySelect2Widget, HeavySelect2TagWidget, ModelSelect2MultipleWidget,
    ModelSelect2TagWidget, ModelSelect2Widget, Select2MultipleWidget,
    Select2Widget, Select2TagWidget
)


class ElectionHeavySelect2TagWidget(HeavySelect2TagWidget):

    def value_from_datadict(self, data, files, name):
        values = super(ElectionHeavySelect2TagWidget, self).value_from_datadict(data, files, name)
        return ",".join(values)

    def optgroups(self, name, value, attrs=None):
        values = value[0].split(',') if value[0] else []
        selected = set(values)
        subgroup = [self.create_option(name, v, v, selected, i) for i, v in enumerate(values)]
        return [(None, subgroup, 0)]

    def build_attrs(self, *args, **kwargs):
        """Add select2's tag attributes."""
        self.attrs.setdefault('data-minimum-input-length', 0)
        return super(ElectionHeavySelect2TagWidget, self).build_attrs(*args, **kwargs)


class WizardWelcomeForm(forms.Form):
    required_css_class = 'required'

    state = forms.ChoiceField(widget=forms.Select(), choices=[], label='')
    election_level = forms.ModelChoiceField(queryset=ElectionLevel.objects.all().exclude(name__in=['State', 'Territory', 'Federal']), label='', empty_label='Election Level')

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(WizardWelcomeForm, self).__init__(*args, **kwargs)

        all_states = list(chain([('0', 'State',)], State.objects.all().values_list('state_id', 'name').order_by('id')))
        self.fields['state'].choices = all_states


class WizardLocationForm(forms.Form):
    required_css_class = 'required'

    # location = forms.ChoiceField(widget=forms.Select(), choices=(consts.GEOID_TO_LOCATIONS), label='Enter the location where the election will be held, not including street')

    location = forms.MultipleChoiceField(
        choices = (),
        label='Enter the location where the election will be held, not including street',
        widget=HeavySelect2MultipleWidget(attrs={'placeholder': 'Type election location'}, data_view='api:ajax_election_locations'))

    contact_email = forms.EmailField(label='Email')
    contact_phone = forms.CharField(max_length=64, label='Phone Number')

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(WizardLocationForm, self).__init__(*args, **kwargs)


class DeadlineForm(forms.Form):
    required_css_class = 'required'

    date = forms.DateField(required=False, input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'Date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    time = forms.TimeField(required=False, input_formats=['%I:%M%p', '%H:%M'],
        widget=forms.TimeInput(attrs={'placeholder': 'Time', 'class': 'timepicker'}, format='%H:%M'))

    description = forms.ModelChoiceField(required=True, queryset=ElectionDateType.objects.all().order_by('position'), initial=1)

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(DeadlineForm, self).__init__(*args, **kwargs)


DomesticRegistrationDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
DomesticRequestDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
DomesticReturnDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)

OverseasRegistrationDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
OverseasRequestDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
OverseasReturnDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)

MilitaryRegistrationDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
MilitaryRequestDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)
MilitaryReturnDeadlineFormSet = formset_factory(DeadlineForm, can_delete=True, min_num=1, validate_min=True, extra=0)


class WizardDatesForm(forms.Form):
    required_css_class = 'required'

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(WizardDatesForm, self).__init__(*args, **kwargs)

        data = kwargs.get('data', None)

        self.domesticRegistrationDeadlineFormSet = DomesticRegistrationDeadlineFormSet(data, prefix='domestic-registration-deadline')
        self.domesticRequestDeadlineFormSet = DomesticRequestDeadlineFormSet(data, prefix='domestic-request-deadline')
        self.domesticReturnDeadlineFormSet = DomesticReturnDeadlineFormSet(data, prefix='domestic-return-deadline')

        self.overseasRegistrationDeadlineFormSet = OverseasRegistrationDeadlineFormSet(data, prefix='overseas-registration-deadline')
        self.overseasRequestDeadlineFormSet = OverseasRequestDeadlineFormSet(data, prefix='overseas-request-deadline')
        self.overseasReturnDeadlineFormSet = OverseasReturnDeadlineFormSet(data, prefix='overseas-return-deadline')

        self.militaryRegistrationDeadlineFormSet = MilitaryRegistrationDeadlineFormSet(data, prefix='military-registration-deadline')
        self.militaryRequestDeadlineFormSet = MilitaryRequestDeadlineFormSet(data, prefix='military-request-deadline')
        self.militaryReturnDeadlineFormSet = MilitaryReturnDeadlineFormSet(data, prefix='military-return-deadline')

        self.fields['domestic_registration_deadline_mode'].initial = 'simple'
        self.fields['domestic_request_deadline_mode'].initial = 'simple'
        self.fields['domestic_return_deadline_mode'].initial = 'simple'

        self.fields['overseas_registration_deadline_mode'].initial = 'simple'
        self.fields['overseas_request_deadline_mode'].initial = 'simple'
        self.fields['overseas_return_deadline_mode'].initial = 'simple'

        self.fields['military_registration_deadline_mode'].initial = 'simple'
        self.fields['military_request_deadline_mode'].initial = 'simple'
        self.fields['military_return_deadline_mode'].initial = 'simple'


    election_name = forms.CharField(
        max_length=256,
        label='Election Name',
        widget=forms.TextInput(attrs={'placeholder': 'e.g. Boston City Council Election; Madison School Board Election'}))

    election_date = forms.DateField(
        label='Election Date',
        input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'When will the election be held?', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    election_type = forms.ModelChoiceField(queryset=ElectionType.objects.all().order_by('id'), empty_label='Select what type of election this is')

    election_day_registration_is_available = forms.BooleanField(required=False)
    military_dates_same_as_overseas = forms.BooleanField(required=False, label='Military dates are the same as Overseas dates')

    domestic_registration_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    domestic_registration_deadline = forms.DateField(
        label='Domestic Registration Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    domestic_request_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    domestic_request_deadline = forms.DateField(
        label='Domestic Request Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    domestic_return_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    domestic_return_deadline = forms.DateField(
        label='Domestic Return Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    overseas_registration_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    overseas_registration_deadline = forms.DateField(
        label='Overseas Registration Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    overseas_request_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    overseas_request_deadline = forms.DateField(
        label='Overseas Request Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    overseas_return_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    overseas_return_deadline = forms.DateField(
        label='Overseas Return Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    military_registration_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    military_registration_deadline = forms.DateField(
        label='Military Registration Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    military_request_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    military_request_deadline = forms.DateField(
        label='Military Request Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    military_return_deadline_mode = forms.CharField(widget=forms.HiddenInput())
    military_return_deadline = forms.DateField(
        label='Military Return Deadline',
        input_formats=consts.INPUT_DATE_FORMATS,
        required=False,
        widget=forms.DateInput(attrs={'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    early_voting_from_date = forms.DateField(
        label='Early Voting',
        required=False,
        input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'available on this date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    early_voting_to_date = forms.DateField(
        label='',
        required=False,
        input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'available until this date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    in_person_absentee_from_date = forms.DateField(
        label='In-Person Absentee Voting',
        required=False,
        input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'available on this date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    in_person_absentee_to_date = forms.DateField(
        label='',
        required=False,
        input_formats=consts.INPUT_DATE_FORMATS,
        widget=forms.DateInput(attrs={'placeholder': 'available until this date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]))

    def is_valid(self):
        valid = super(WizardDatesForm, self).is_valid()
        if not valid:
            return valid

        dates = (
            ('domestic_registration_deadline_mode', self.domesticRegistrationDeadlineFormSet),
            ('domestic_request_deadline_mode', self.domesticRequestDeadlineFormSet),
            ('domestic_return_deadline_mode', self.domesticReturnDeadlineFormSet),
            ('overseas_registration_deadline_mode', self.overseasRegistrationDeadlineFormSet),
            ('overseas_request_deadline_mode', self.overseasRequestDeadlineFormSet),
            ('overseas_return_deadline_mode', self.overseasReturnDeadlineFormSet),
        )

        for (mode, form_set) in dates:
            if self[mode].value() == 'advanced' and not form_set.is_valid():
                return False

        if self.cleaned_data['military_dates_same_as_overseas'] == False:
            mulitary_dates = (
                ('military_registration_deadline_mode', self.militaryRegistrationDeadlineFormSet),
                ('military_request_deadline_mode', self.militaryRequestDeadlineFormSet),
                ('military_return_deadline_mode', self.militaryReturnDeadlineFormSet),
            )
            for (mode, form_set) in mulitary_dates:
                if self[mode].value() == 'advanced' and not form_set.is_valid():
                    return False
        return True


class WizardAdditionalForm(forms.Form):
    required_css_class = 'required'

    additional_information = forms.CharField(
        max_length=1024,
        label='Additional Information',
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 5,
            'cols': None,
            'placeholder': 'Enter any additional information you would like to provide to voters. This info will be made public when published.'}))


    use_default_elections_website = forms.BooleanField(
        label='Use Default Elections Website',
        required=False)

    contact_email = forms.EmailField(label='Election Manager Email',
        widget=ElectionHeavySelect2TagWidget(data_url='api:ajax_election_emails_by_locations')
    )

    use_user_email_as_contact_email = forms.BooleanField(
        label='Use My Email as Election Manager Contact',
        required=False)

    elections_website = forms.URLField(
        label='Elections Website',
        required=True,
        widget=forms.URLInput(attrs={'placeholder': 'http://'}))

    official_candidate_listing = forms.URLField(
        label='Official Candidate Listing',
        required=False,
        widget=forms.URLInput(attrs={'placeholder': 'http://'}))

    sample_ballot_information = forms.URLField(
        label='Sample Ballot Information',
        required=False,
        widget=forms.URLInput(attrs={'placeholder': 'http://'}))

    feedback = forms.CharField(
        max_length=1024,
        label='Feedback/Comments',
        required=False,
        widget=forms.Textarea(attrs={
            'rows': 5,
            'cols': None,
            'placeholder': 'Please let us know your experience using this service. This information will not be published'}))


    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        data = kwargs.get('data', {}) or {}
        use_default_elections_website = data.get('additional-use_default_elections_website', False)
        use_user_email_as_contact_email = data.get('additional-use_user_email_as_contact_email', False)

        super(WizardAdditionalForm, self).__init__(*args, **kwargs)

        self.fields['use_default_elections_website'].initial = True
        self.fields['use_user_email_as_contact_email'].initial = True

        if use_default_elections_website or not self.request.user.is_authenticated:
            self.fields['elections_website'].required = False

        if use_user_email_as_contact_email or not self.request.user.is_authenticated:
            self.fields['contact_email'].required = False


class ElectionForm(forms.ModelForm):

    required_css_class = 'required'

    location = forms.MultipleChoiceField(choices = (), label='Locations',
        widget=HeavySelect2MultipleWidget(attrs={'placeholder': 'Type election location'}, data_url='api:ajax_election_locations'))
    contact_email = forms.EmailField(label='Election Manager Email',
        widget=ElectionHeavySelect2TagWidget(data_url='api:ajax_election_emails')
    )

    class Meta:
        model = Election
        fields = (
            'title',
            'user',
            'election_level',
            'election_type',
            'election_day_registration_is_available',
            'use_overseas_dates_as_military_dates',
            'election_date',
            'use_default_elections_website',
            'use_user_email_as_contact_email',
            'contact_email',
            'additional_information',
            # 'location',
        )

        labels = {
            'title': 'Name of Election',
            'election_date': 'Election Date',
            'election_level': 'Election Level',
            'election_type': 'Election Type',
            'use_user_email_as_contact_email': 'Use user email as election manager email',
            'use_overseas_dates_as_military_dates': 'Military dates are the same as Overseas dates',
        }

        widgets = {
            'user': forms.HiddenInput(),
            'election_date': forms.DateInput(attrs={'placeholder': 'When will the election be held?', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]),
        }

        exclude = (
            'created_at',
            'updated_at',
            'contact_phone',
        )


    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)

        data = self.request.POST or {}
        use_default_elections_website = data.get('use_default_elections_website', False)
        use_user_email_as_contact_email = data.get('use_user_email_as_contact_email', False)

        state = kwargs.pop('state', None)

        super(ElectionForm, self).__init__(*args, **kwargs)

        # restore current election locations
        instance = kwargs.get('instance')
        state = instance.get_election_state() if instance else state

        if self.request:
            self.fields['user'].initial = self.request.user

        # locations
        locations = [("%s.%s" % (l.location_type,l.geoid)) for l in instance.locations.all()] if instance else None
        self.fields['location'].initial = locations

        if state:
            self.fields['location'].widget.data_url = build_url('api:ajax_election_locations', get={'state_id': state.state_id })
            self.fields['location'].choices = get_all_locations_as_choices(state.state_id)

        self.fields['location'].required = False

        # contact email
        contact_emails = []
        if instance:
            contact_emails = Election.objects.get_contact_emails(instance)
            #contact_emails_pa = list(zip(contact_emails, contact_emails))
            self.fields['contact_email'].widget.data_url = reverse('api:ajax_election_emails', kwargs={'election_id': instance.pk })
            self.fields['contact_email'].initial = [instance.contact_email]
            self.fields['contact_email'].choices = [(email, email,) for email in contact_emails]

        if use_user_email_as_contact_email:
            self.fields['contact_email'].required = False

        # dates
        self.fields['election_date'].input_formats = consts.INPUT_DATE_FORMATS

        # level
        self.fields['election_level'].empty_label='Election Level'
        self.fields['election_level'].queryset = ElectionLevel.objects.all()

    # def is_valid(self):
    #     print("is_valid")
    #     return True

    def save(self, *args, **kwargs):
        
        instance = super(ElectionForm, self).save(*args, **kwargs)
        # old_locations = self.fields['location'].initial or []
        # new_locations = self.cleaned_data['location'] if self.cleaned_data != None and 'location' in self.cleaned_data else old_locations
        
        # for ol in old_locations:
        #     if ol in new_locations:
        #         # keep old location
        #         new_locations.remove(ol)
        #     else:
        #         # delete old_location
        #         (location_type, geoid) = ol.split('.')
        #         Location.objects.filter(election=instance, location_type=location_type, geoid=geoid).delete()  # Delete in bulk?

        # save_locations(instance, new_locations)
        return instance


ElectionLocationFormSet = inlineformset_factory(Election, Location, fields=(
        'location_type',
        'geoid',
        'name',
    ), can_delete=True, min_num=1, validate_min=True, extra=0)


class BaseElectionDateFormSet(BaseInlineFormSet):
    error_css_class='required'


def election_date_formset_factory(request, election, election_date_type, prefix):

    is_single_date = election_date_type in (consts.ELECTION_DATE_EARLY_VOTING_FROM, consts.ELECTION_DATE_EARLY_VOTING_TO,
        consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_FROM, consts.ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_TO,)

    def formfield_callback(field, **kwargs):
        formfield = field.formfield(**kwargs)
        if field.name == 'date':
            formfield.input_formats = consts.INPUT_DATE_FORMATS
        elif field.name == 'kind':
            formfield.initial = election_date_type
        return formfield

    can_delete = True
    min_num = 0
    max_num = None
    extra = 0
    widgets = {
        'kind': forms.HiddenInput(),
        'time': forms.TimeInput(attrs={'placeholder': 'Time', 'class': 'timepicker'}, format='%H:%M'),
        'date': forms.DateInput(attrs={'placeholder': 'Date', 'class': 'datepicker'}, format=consts.INPUT_DATE_FORMATS[3]),
    }

    if is_single_date:
        max_num = 1
        widgets['date_type'] = forms.HiddenInput(attrs={'class': 'date-type'})

    factory = inlineformset_factory(Election, ElectionDate, formset=BaseElectionDateFormSet, fields=(
            'kind',
            'date_type',
            'date',
            'time',
            'time_zone',
        ), widgets=widgets,
        labels={
            'date_type': 'Description'
        }, formfield_callback=formfield_callback, can_delete=can_delete, min_num=min_num, max_num=max_num, validate_min=True, extra=extra)

    if election:
        queryset = election.dates.filter(kind=election_date_type).all()
    else:
        queryset = ElectionDate.objects.none()

    return factory(request.POST or None, instance=election, queryset=queryset, prefix=prefix)


ElectionURLFormSet = inlineformset_factory(Election, URL, fields=(
        'url_type',
        'url',
    ),
    labels={
        'url_type': 'Type',
        'url': 'URL'
    },
    can_delete=False, min_num=0, validate_min=True, extra=0)


ElectionFeedbackFormset = inlineformset_factory(Election, Feedback, fields=(
        'notes',
    ),
    widgets={
        'notes': forms.Textarea(attrs={
            'placeholder': 'Enter any feedback you would like to provide.',
            'cols': 80, 'rows': 3})
    },
    can_delete=False, min_num=1, max_num=1, extra=0)



class UploaderForm(forms.Form):

    name = forms.CharField(label='Your Name', max_length=100, strip=True)
    email = forms.EmailField(label='Your Email', max_length=100)
    phone = PhoneNumberField(label='Your Phone', max_length=100)
    notes = forms.CharField(label='Update Log Notes',
        max_length=1024,
        widget=forms.Textarea(attrs={
            'placeholder': 'Enter any additional information you would like to provide.',
            'cols': 80, 'rows': 3}),
        required=False)

    def __init__(self, *args, **kwargs):
        super(UploaderForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.disable_csrf = True
        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-lg-4'
        self.helper.field_class = 'col-lg-6'


class ElectionResult(forms.ModelForm):

    election_id = forms.IntegerField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = ElectionResult
        fields = (
            'election_id',
            'notes',
            'upload_by_user',
            'uploader_name',
            'uploader_phone',
            'uploader_email',
        )

        labels = {
            'notes': 'Notes'
        }

        widgets = {
            'notes': forms.Textarea(attrs={
                'rows': 3,
                'cols': None,
                'placeholder': 'Enter any additional information you would like to provide about results.'
            })
        }

    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(ElectionResult, self).__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.disable_csrf = False
        self.helper.form_class = 'form-horizontal'
        self.helper.form_method = 'POST'
        self.helper.form_action = '' # reverse_lazy('#')
        self.helper.label_class = 'col-lg-4'
        self.helper.field_class = 'col-lg-6'

        layout = [
            HTML("""<div class='attachment-results-container row'>
              {% load crispy_forms_tags crispy_forms_filters %}
              {{ attachment_formset.management_form }}
              {% if attachment_formset.non_form_errors %}
                  {{ attachment_formset|as_crispy_errors }}
              {% endif %}
            """),
            Fieldset("""Files
            <small class="glyphicon glyphicon-plus pull-right btn-add" aria-hidden="true"></small>
            """,
            HTML("""
              {% load crispy_forms_tags crispy_forms_filters %}
                  {% for f in attachment_formset %}
                  <div class='attachment-form col-lg-12'>
                      <div class='attachment-form-instance'>
                          {% crispy f attachment_formset_helper %}
                      </div>
                  </div>
              {% endfor %}
            """)),
            HTML("""</div>"""),
            Fieldset(
                '',
                'notes'),
        ]

        if not self.request.user.is_authenticated:
            layout.append(Fieldset('Uploaded By', 'uploader_name', 'uploader_phone', 'uploader_email'))

        self.helper.layout = Layout(*layout)

        self.fields['upload_by_user'].widget = forms.HiddenInput()
        self.fields['uploader_email'].widget.attrs.update({'placeholder': 'name@domain.tld'})
        self.fields['uploader_phone'].widget.attrs.update({'placeholder': 'XXX-XXX-XXXX', 'pattern': "\d{3}-\d{3}-\d{4}"})

        if self.request.user.is_authenticated:
            self.fields['uploader_name'].widget = forms.HiddenInput()
            self.fields['uploader_phone'].widget = forms.HiddenInput()
            self.fields['uploader_email'].widget = forms.HiddenInput()


class ElectionResultAttachmentForm(forms.ModelForm):

    class Meta:
        model = ElectionResultAttachment
        fields = (
            'file',
        )

    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)
        super(ElectionResultAttachmentForm, self).__init__(*args, **kwargs)


class BaseElectionResultAttachmentFormSet(forms.BaseModelFormSet):
    def __init__(self, *args, **kwargs):
        super(BaseElectionResultAttachmentFormSet, self).__init__(*args, **kwargs)
        self.queryset = ElectionResultAttachment.objects.none()

ElectionResultAttachmentFormSet = modelformset_factory(ElectionResultAttachment,
    form=ElectionResultAttachmentForm,
    formset=BaseElectionResultAttachmentFormSet,
    min_num=1,
    validate_min=True,
    extra=0,
    can_delete=False,
    fields=(
        'file',
    ),
)

class ElectionResultAttachmentFormSetHelper(FormHelper):

    def __init__(self, *args, **kwargs):
        super(ElectionResultAttachmentFormSetHelper, self).__init__(*args, **kwargs)
        self.form_tag = False
        self.disable_csrf = True
        self.form_class = 'form-horizontal'
        self.label_class = 'col-lg-4'
        self.field_class = 'col-lg-6'

        self.render_required_fields = True
        self.render_hidden_fields = True
