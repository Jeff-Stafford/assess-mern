from itertools import chain
from django import forms
from django.core.exceptions import ValidationError
from django.forms import formset_factory, BaseInlineFormSet
from django.forms.models import inlineformset_factory, modelformset_factory
from django.template import Template
from django.template.loader import render_to_string, get_template
from django.utils.translation import ugettext_lazy as _

from django.utils import html

from django_select2.forms import (
    HeavySelect2MultipleWidget, HeavySelect2Widget, ModelSelect2MultipleWidget,
    ModelSelect2TagWidget, ModelSelect2Widget, Select2MultipleWidget,
    Select2Widget
)

from crispy_forms.utils import (
    TEMPLATE_PACK, flatatt, get_template_pack, render_field,
)
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Fieldset, Div, Row, HTML, ButtonHolder, Submit, Button, MultiField
from crispy_forms.bootstrap import StrictButton, FormActions

from eod.models import LocalOfficial, Address, Officer, LocalOfficialType

from django.forms import formsets, models

import re

PHONE_VALIDATION_PATTERN = "^\(\d{3}\) \d{3}-\d{4}( x(\d{1,5}))?$"
FAX_VALIDATION_PATTERN = "^\(\d{3}\) \d{3}-\d{4}$"
PHONE_MASK = "(123) 123-1234 x123"
FAX_MASK = "(123) 123-1234"


def phone_validator(value, value_type):
    if re.match(PHONE_VALIDATION_PATTERN, value) is not None:
        return
    raise ValidationError(_('%s number is not valid' % value_type))


def _phone_validator(value):
    phone_validator(value, "Phone")


def _fax_validator(value):
    phone_validator(value, "Fax")


def _all_zips_validator(value, max_len):
    if value is None or len(value) == 0 or len(value.strip()) == 0:
        return

    value = value.strip()
    if not value.isdigit() or len(value) != max_len:
        raise ValidationError(_('Zip code is not valid'))


def zip_validator(value):
    _all_zips_validator(value, 5)

def zip4_validator(value):
    _all_zips_validator(value, 4)


class FullZipField(Div):
    template = "eod/full_zip_field.html"

    def __init__(self, *fields, **kwargs):
        super(FullZipField, self).__init__(*fields, **kwargs)

    def render(self, form, form_style, context, template_pack=TEMPLATE_PACK, **kwargs):
        template = get_template(self.get_template_name(template_pack))

        if hasattr(form, 'rendered_fields'):
            for field in ('zip', 'zip4'):
                if not field in form.rendered_fields:
                    form.rendered_fields.add(field)

        return template.render({'form': form})


class AddressForm(forms.ModelForm):
    class Meta:
        model = Address

        fields = (
            'id',
            'order_number',
            'address_to',
            'street1',
            'street2',
            'city',
            'zip',
            'zip4',
            'main_email',
            'main_phone_number',
            'main_fax_number',
            'website',
            'functions',
        )

        labels = {
            'functions': 'Used For',
        }

    id = forms.IntegerField(required=True, widget=forms.HiddenInput())
    order_number = forms.IntegerField(required=True, widget=forms.HiddenInput())
    address_to = forms.CharField(label="Address To", max_length=255, required=True, strip=True)
    street1 = forms.CharField(label="Street #1", max_length=255, required=True, strip=True)
    street2 = forms.CharField(label="Street #2", max_length=255, required=False, strip=True)
    city = forms.CharField(label="City", max_length=255, required=True, strip=True)
    main_email = forms.EmailField(label="Main Office Email", max_length=255, required=False)
    main_phone_number = forms.CharField(label="Main Office Phone #", max_length=255, required=False, strip=True)
    main_fax_number = forms.CharField(label="Main Office Fax #", max_length=255, required=False, strip=True)
    zip = forms.CharField(label="Zip Code", max_length=5, required=True, strip=True)
    zip4 = forms.CharField(label="Zip Code +4", max_length=4, required=False, strip=True)

    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)

        super(AddressForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.disable_csrf = True
        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-xs-4'
        self.helper.field_class = 'col-xs-6'
        self.helper.layout = Layout(
            'address_to',
            'street1',
            'street2',
            'city',
           )

        self.fields['zip'].validators = [zip_validator]
        self.fields['zip4'].validators = [zip4_validator]
        self.fields['main_fax_number'].validators = [_fax_validator]
        self.fields['main_phone_number'].validators = [_phone_validator]
        self.fields['main_email'].widget.attrs = {'placeholder': 'example@domain.com'}
        self.fields['main_phone_number'].widget.attrs.update({'placeholder': PHONE_MASK, 'pattern': PHONE_VALIDATION_PATTERN, 'title':'Please match the requested format (XXX) XXX-XXXX exactly. Denote extensions with xYYY.'})
        self.fields['zip'].widget.attrs.update({'placeholder': "XXXXX", 'pattern': "^\d{5}$"})
        self.fields['main_fax_number'].widget.attrs.update({'placeholder': FAX_MASK, 'pattern': FAX_VALIDATION_PATTERN, 'title':'Please match the requested format (XXX) XXX-XXXX exactly.'})
        self.fields['website'].widget.attrs.update({'placeholder': 'Should start with http:// or https://'})

        if self.read_only:
            for field in self.fields:
                self.fields[field].required = False
                self.fields[field].widget.attrs={'readonly':'readonly'}
            if field == "primary_contact":
                self.field[field].widget.attrs={'data-object': 'contacts-pane'}
        else:
            required_attrs = [
                'office_name',
                'first_name',
                'last_name',
                'phone',
                'email',
                'primary_contact',
            ]
            for field in self.fields:
                self.fields[field].widget.attrs={'autofill ': 'off'}
                if field in required_attrs:
                    self.fields[field].widget.attrs={'data-required': 'yes'}


class Addresses(object):
    def render(self, form, form_style, context, template_pack):
        return render_to_string('eod/localofficialcorrection_addresses.html', context=context.flatten())


class Officers(object):
    def render(self, form, form_style, context, template_pack):
        return render_to_string('eod/localofficialcorrection_officers.html', context=context.flatten())


class AddressFormSetHelper(FormHelper):

    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)

        super(AddressFormSetHelper, self).__init__(*args, **kwargs)
        self.form_tag = False
        self.disable_csrf = True
        self.form_class = 'form-horizontal'
        self.label_class = 'col-xs-4'
        self.field_class = 'col-xs-6'
        self.layout = Layout(
            'id',
            'order_number',
            'address_to',
            'street1',
            'street2',
            'city',
            FullZipField('zip', 'zip4',),
            'website',
        )

        self.render_required_fields = True
        self.render_hidden_fields = True


class LocalOfficialForm(forms.ModelForm):
    id = forms.IntegerField(required=True, widget=forms.HiddenInput())

    class Meta:
        model = LocalOfficial

        fields = (
            'id',
            'further_instruction',
            'hours',
            'geoid',
            'type',
        )

        labels = {
            'further_instruction': 'Further Instructions',
            'hours': 'Office Hours',
            'geoid': "GEO ID",
            'type' : "Local Office Type"
        }

        widgets = {
            'further_instruction': forms.Textarea(attrs={'placeholder': '', 'cols': 120, 'rows': 6}),
            'type': forms.Select(choices=LocalOfficialType.choices())
        }

    def __init__(self, *args, **kwargs):
        self.is_admin = kwargs.pop('is_admin', False)

        super(LocalOfficialForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_tag = True
        self.helper.disable_csrf = False
        self.helper.form_class = 'form-horizontal'
        self.helper.form_method = 'POST'
        self.helper.form_action = '' # reverse_lazy('#')
        self.helper.attrs={'autofill ': 'off'}
        self.helper.label_class = 'col-xs-4'
        self.helper.field_class = 'col-xs-6'

        required_attrs = [
            'hours',
        ]

        if self.is_admin:
            read_only_fields = []
        else:
            read_only_fields = ['geoid']

        for field in self.fields:
            self.fields[field].widget.attrs={'autofill ': 'off'}
            if field in required_attrs:
                self.fields[field].widget.attrs={'data-required': 'yes'}
            if field in read_only_fields:
                self.fields[field].widget.attrs={'readonly': True}

        layout = [
            HTML("<div class='form-container'>"),
            HTML("""
                <div class="panel panel-form">
                    <div class="panel-heading">
                        <h3>Election Official Contact Details</h3>
                    </div>
                    <div class="panel-body officers-container">
            """),
            Officers(),
            HTML("</div></div><br />"),

            HTML("<div class='form-container'>"),
            HTML("""
                <div class="panel panel-form">
                    <div class="panel-heading">
                    <h3>Local Official Addresses</h3>
                    </div>
                    <div class="panel-body addresses-container">
            """),
            Addresses(),
            HTML("""
                </div>
            </div>
            """),
            HTML("</div>"),

            HTML("<div class='form-container additional-container'>"),
            HTML("""
                <div class="panel panel-form">
                    <div class="panel-heading">
                        <h3>Additional Information</h3>
                    </div>
                    <div class="panel-body">
            """),
            Fieldset('', 'type', 'geoid', 'hours', 'further_instruction', css_class='form-instance', autofill='off'),
            HTML("""
                    </div>
                </div>
            </div>
            <br />
            """),
        ]

        if self.is_admin:
            layout.append(Submit('submit', 'Update', css_class='btn btn-success pull-right'))
        else:
            layout.append(Div(
                HTML("<div class='panel panel-form'><div class='panel-heading'><h3>Submitted By</h3></div><div class='panel-body'>{% if submitter_form %}{% load crispy_forms_tags %}{% crispy submitter_form %}{% endif %}</div></div>"),
                FormActions(
                    Submit('submit', 'Submit Updates', css_class='btn btn-success pull-right')
                ),
                css_class='form-container submitted-by-container'
            ))

        self.helper.layout = Layout(
            *layout
        )


class OfficerForm(forms.ModelForm):

    id = forms.IntegerField(required=False, widget=forms.HiddenInput())
    order_number = forms.IntegerField(required=True, widget=forms.HiddenInput())
    phone = forms.CharField(label="Phone", required=True, max_length=255, strip=True)
    fax = forms.CharField(label="Fax", required=False, max_length=255, strip=True)
    office_name = forms.CharField(label="Job Title", max_length=255, required=True, strip=True)
    first_name = forms.CharField(label="First Name", max_length=255, strip=True)
    last_name = forms.CharField(label="Last Name", max_length=255, strip=True)
    email = forms.EmailField(label="E-mail", max_length=255, required=True)

    DELETE = forms.BooleanField(widget=forms.HiddenInput())
    nonpersistedid = forms.CharField(required=False, widget=forms.HiddenInput())


    class Meta:
        model = Officer

        fields = (
            'order_number',
            'office_name',
            'first_name',
            'last_name',
            'phone',
            'fax',
            'email',
        )

        labels = {
            'office_name': 'Job Title',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'phone': 'Phone',
            'fax': 'Fax',
            'email': 'E-mail',
        }


    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)
        super(OfficerForm, self).__init__(*args, **kwargs)
        for field in OfficerForm.Meta.fields:
            self.fields[field].widget.attrs={'autofill ': 'off'}
            self.fields[field].required = False

        self.fields['email'].widget.attrs.update({'placeholder': 'example@domain.com'})
        self.fields['phone'].widget.attrs.update({'placeholder': PHONE_MASK, 'pattern': PHONE_VALIDATION_PATTERN, 'title':'Please match the requested format (XXX) XXX-XXXX exactly. Denote extensions with xYYY.'})
        self.fields['fax'].widget.attrs.update({'placeholder': FAX_MASK, 'pattern': FAX_VALIDATION_PATTERN, 'title':'Please match the requested format (XXX) XXX-XXXX exactly.'})

        self.fields['fax'].validators = [_fax_validator]
        self.fields['phone'].validators = [_phone_validator]

        required_attrs = [
            'office_name',
            'phone',
            'email',
        ]
        for field in self.fields:
            if field in required_attrs:
                self.fields[field].widget.attrs.update({'data-required': 'yes'})


OfficerFormSet = modelformset_factory(Officer,
    form=OfficerForm,
    extra=0,
    can_delete=True,
    fields=(
        'id',
        'order_number',
        'office_name',
        'first_name',
        'last_name',
        'phone',
        'fax',
        'email',
    ))


AddressFormset = modelformset_factory(
    Address,
    form=AddressForm,
    extra=0,
    can_delete=True,
    fields=(
        'id',
        'order_number',
        'address_to',
        'street1',
        'street2',
        'city',
        'zip',
        'zip4',
        'main_email',
        'main_phone_number',
        'main_fax_number',
        'website',
    ))


class OfficerFormSetHelper(FormHelper):

    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)

        super(OfficerFormSetHelper, self).__init__(*args, **kwargs)
        self.form_tag = False
        self.disable_csrf = True
        self.form_class = 'form-horizontal'
        self.label_class = 'col-xs-4'
        self.field_class = 'col-xs-6'
        self.layout = Layout(
            'id',
            'order_number',
            'office_name',
            'first_name',
            'last_name',
            'phone',
            'fax',
            'email',
        )

        self.render_required_fields = True
        self.render_hidden_fields = True



SUBMISSION_TYPE = (
    ('Y', 'The record needs to be changed; please update this information.'),
    ('N', 'I\'ve reviewed the information and it is correct; no updates are needed.'),
)

class SubmitterForm(forms.Form):

    name = forms.CharField(label='Name', max_length=100, strip=True)
    email = forms.EmailField(label='Email', max_length=100)
    phone = forms.CharField(label='Phone', max_length=100)
    submission_type = forms.ChoiceField(label='Submission Type',
        choices=SUBMISSION_TYPE,
        widget=forms.RadioSelect())

    notes=forms.CharField(label='Update Log Notes',
        max_length=1024,
        widget=forms.Textarea(attrs={
            'placeholder': 'Enter any additional information you would like to provide. This information will not be displayed to the public.',
            'cols': 80, 'rows': 3}),
        required=False)

    def __init__(self, *args, **kwargs):
        self.read_only = kwargs.pop('read_only', False)
        super(SubmitterForm, self).__init__(*args, **kwargs)

        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.disable_csrf = True
        self.helper.form_class = 'form-horizontal'
        self.helper.label_class = 'col-xs-4'
        self.helper.field_class = 'col-xs-6'

        for field in self.fields:
            self.fields[field].widget.attrs={'autofill ': 'off'}
            self.fields[field].required = False

        self.fields['name'].widget.attrs.update({'data-required':'yes'})
        self.fields['submission_type'].widget.attrs.update({'data-required':'yes'})
        self.fields['name'].widget.attrs.update({'required': 'required'})
        self.fields['email'].widget.attrs.update({'required': 'required'})
        self.fields['phone'].widget.attrs.update({'required': 'required'})
        self.fields['submission_type'].widget.attrs.update({'required':'required'})

        self.fields['name'].widget.attrs.update({'required': 'required'})
        self.fields['email'].widget.attrs.update({'required': 'required'})
        self.fields['phone'].widget.attrs.update({'required': 'required'})
        self.fields['submission_type'].widget.attrs.update({'required':'required'})

        self.fields['email'].widget.attrs.update({
            'placeholder': 'example@domain.com',
            'data-required': 'yes',
            })
        self.fields['phone'].widget.attrs.update({
            'placeholder': PHONE_MASK,
            'data-required': 'yes',
            'pattern': PHONE_VALIDATION_PATTERN,
            })

        if self.read_only:

            for field in self.fields:
                self.fields[field].widget.attrs.update({'readonly':'readonly', 'disabled': 'disabled'})

            self.fields['submission_type'].widget.attrs.update({'disabled':'disabled'})

            self.helper.layout = Layout(
                Fieldset(
                    '',
                    HTML("<div class='panel-heading'><h3>Submitted By</h3></div>"),
                    'name',
                    'email',
                    'phone',
                    'submission_type',
                    'notes',
                    css_class='form-container submitted-by-container corrections'
                )
            )



CORRECTION_STATUS_APPROVED = 'A'
CORRECTION_STATUS_REJECTED = 'R'
CORRECTION_STATUS_DEFAULT = CORRECTION_STATUS_REJECTED


class CorrectionForm(forms.Form):
    correction_path = forms.CharField(max_length=100, strip=True)
    correction_status = forms.CharField(max_length=1)


CorrectionFormSet = formset_factory(CorrectionForm, extra=0)


class SearchForm(forms.Form):
    query = forms.CharField(
        initial='',
        widget=forms.TextInput(attrs={
            'placeholder': '',
            'class': 'search form-control'
        }))

    # def __init__(self, data=None, *args, **kwargs):
    #     if data and 'reset' in data:
    #         data = {}
    #     super(SearchForm, self).__init__(data, *args, **kwargs)
