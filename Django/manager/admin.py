import operator
from itertools import chain
from functools import partial, reduce

from django import forms
from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.contrib.admin.utils import lookup_needs_distinct
from django.contrib.admin.filters import AllValuesFieldListFilter, RelatedFieldListFilter
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from manager import models
from manager import forms as mforms
from electiongis.models import State, get_all_locations_as_choices

from django_select2.forms import (
    HeavySelect2MultipleWidget, HeavySelect2Widget, ModelSelect2MultipleWidget,
    ModelSelect2TagWidget, ModelSelect2Widget, Select2MultipleWidget,
    Select2Widget
)


@admin.register(models.ElectionLevel)
class ElectionLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'position')
    list_editable = ('name', 'position')


@admin.register(models.ElectionType)
class ElectionTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'priority', )
    list_editable = ('name', 'priority', )


@admin.register(models.ElectionTypeDetail)
class ElectionTypeDetailAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'priority', )
    list_editable = ('name', 'priority', )


@admin.register(models.AdministrationLevel)
class AdministrationLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', )
    list_editable = ('name', )


class ElectionDateAdminForm(forms.ModelForm):

    def clean(self, *args, **kwargs):
        clean_data = super(ElectionDateAdminForm, self).clean(*args, **kwargs)
        errors = []
        dt = clean_data['date_type']
        if dt:
            if dt.format_has_date() and clean_data['date'] is None:
                errors.append(forms.ValidationError('Invalid date', code='invalid_election_date_type_date'))
            if dt.format_has_time() and clean_data['time'] is None:
                errors.append(forms.ValidationError('Invalid time', code='invalid_election_date_type_time'))
            if dt.format_has_datetime() and (clean_data['date'] is None and clean_data['time'] is None):
                errors.append(forms.ValidationError('Invalid date and/or time', code='invalid_election_date_type_datetime'))
        if errors:
            raise forms.ValidationError(errors)

        return clean_data


class ElectionDateInline(admin.TabularInline):
    form = ElectionDateAdminForm

    model = models.ElectionDate
    extra = 0


class LocationInline(admin.TabularInline):
    verbose_name = "Location or Jurisdiction"
    verbose_name_plural = "Locations & Jurisdictions"
    model = models.Location
    extra = 0


class URLInline(admin.TabularInline):
    model = models.URL
    extra = 0


class FeedbackInline(admin.TabularInline):
    model = models.Feedback
    min_num = 1
    max_num = 1
    can_delete = False

    verbose_name = "Feedback/Comment"
    verbose_name_plural = "Feedback/Comments"

    def formfield_for_dbfield(self, db_field, **kwargs):
        formfield = super(FeedbackInline, self).formfield_for_dbfield(db_field, **kwargs)
        request = kwargs.pop("request", None)
        if db_field.name == 'notes':
            formfield.widget = forms.Textarea(attrs={'placeholder': 'This information will not be published.', 'cols': 80, 'rows': 3})

        return formfield


class CountyFipsChoiceField(forms.ChoiceField):
    def validate(self, value):
        if len(value) == 0:
            # raise ValidationError(_('Election County is required'), params={'county_fips': value},)
            pass


class ElectionAdminForm(forms.ModelForm):

    county_fips = CountyFipsChoiceField(widget=forms.Select(attrs={}), choices=[], label='Election County', required=False)

    class Meta:
        model = models.Election
        fields = (
            'user',
            'contact_email',
            'contact_phone',
            'title',
            'state_geoid',
            'election_date',
            'election_level',
            'election_type',
            'election_type_detail',
            'election_status',
            'election_day_registration_is_available',
            'use_overseas_dates_as_military_dates',
            'is_public',
            'request_email_was_sent',
            'request_email_was_sent_at',
            'additional_information',
            'use_default_elections_website',
            'use_user_email_as_contact_email',
            'county_fips',
        )

        labels = {
            'title': 'Name of Election',
            'user': 'Creator',
            'contact_email': 'Creator E-mail',
            'contact_phone': 'Creator Phone',
            'admin_first_name': "Administrator First Name",
            'admin_last_name': "Administrator Last Name",
            'admin_email': "Administrator E-mail",
            'admin_phone': "Administrator Phone",
            'admin_title': "Administrator Title",
            'admin_level': "Administration Level",
            'election_type': "Election Type",
            'election_level': "Election Level",
            'election_date': "Election Date",
            'election_status': "Election Status",
            'election_type_detail': "Election Type Detail",
            'county_fips': 'Election County',
        }


        widgets = {
            'additional_information': forms.Textarea(attrs={'placeholder': 'Enter any additional information you would like to provide to voters. This info will be made public when published.', 'cols': 80, 'rows': 3})
        }


    # TBD: Fix location widget for admin
    # location = forms.MultipleChoiceField(
    #     choices = (),
    #     label='Locations',
    #     widget=HeavySelect2MultipleWidget(attrs={'placeholder': 'Type election location'}, data_view='api:ajax_election_locations'))

    state_geoid = forms.ChoiceField(widget=forms.Select(), choices=[], label='Election State')

    def __init__(self, *args, **kwargs):
        super(ElectionAdminForm, self).__init__(*args, **kwargs)
        all_states = list(chain([('', 'State',)], State.objects.all().values_list('state_id', 'name').order_by('id')))
        self.fields['state_geoid'].choices = all_states

        from electiongis import models as gismodels
        selected_county_fips = self.data.get("state_geoid", self.instance.state_geoid)
        all_state_counties = list(chain([('', 'Select Election County',)], gismodels.County.objects.filter(state_id=selected_county_fips)
                                        .values_list('geoid', 'namelsad').order_by('namelsad')))
        self.fields['county_fips'].choices = all_state_counties


class StateFilter(SimpleListFilter):
    title = 'state'
    parameter_name = 'state_geoid'
    template = 'admin/dropdown_filter.html'

    def lookups(self, request, model_admin):
        return list(State.objects.all().values_list('geoid', 'name').order_by('id'))

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(state_geoid=self.value())
        else:
            return queryset



@admin.register(models.Election)
class ElectionAdmin(admin.ModelAdmin):
    actions = ['archive_elections', 'approve_elections']

    form = ElectionAdminForm
    save_as = True

    search_fields = ('title',)
    list_display = ('title', 'user', 'get_state_geoid', 'election_date', 'election_level', 'election_type', 'election_type_detail', 'election_status', 'is_public', 'request_email_was_sent', 'request_email_was_sent_at',)
    #list_editable = ('title', 'election_status', 'is_public')
    list_display_links = ('title',)

    list_filter = (StateFilter, 'election_status', 'election_level', 'election_type',)


    fields = (
        'user',
        'contact_email',
        'contact_phone',

        'admin_first_name',
        'admin_last_name',
        'admin_title',
        'admin_email',
        'admin_phone',
        'admin_level',

        'title',
        'state_geoid',
        'county_fips',
        'election_date',
        'election_level',
        'election_type',
        'election_type_detail',
        'election_status',
        'election_day_registration_is_available',
        'use_overseas_dates_as_military_dates',

        'is_public',
        'request_email_was_sent',
        'request_email_was_sent_at',
        'additional_information',
    )


    inlines = (
        ElectionDateInline,
        LocationInline,
        URLInline,
        FeedbackInline,
    )

    def get_state_geoid(self, obj):
        return State.objects.filter(geoid=obj.state_geoid).get().name
    get_state_geoid.short_description = 'Election State'
    get_state_geoid.admin_order_field = 'state_geoid'

    def get_all_states(self, obj):
        return list(chain([('', 'State',)], State.objects.all().values_list('state_id', 'name').order_by('id')))


    def formfield_for_dbfield(self, db_field, **kwargs):
        formfield = super(ElectionAdmin, self).formfield_for_dbfield(db_field, **kwargs)

        request = kwargs.pop("request", None)
        if request and request.user.is_superuser:
            if db_field.name == 'contact_email':
                formfield.initial = 'info@usvotefoundation.org'
            elif db_field.name == 'contact_phone':
                formfield.initial = '+1(202)470-2480'

        if db_field.name == 'user':
            formfield.initial = request.user

        return formfield

    def archive_elections(self, request, queryset):
        queryset.update(election_status='Z')
    archive_elections.short_description = "Archive selected elections"

    def approve_elections(self, request, queryset):
        queryset.update(election_status='A')
    approve_elections.short_description = "Approve selected elections"


@admin.register(models.ElectionDateType)
class ElectionDateTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'date_format', 'time_format', 'format', 'position', 'default')
    list_editable = ('name', 'date_format', 'time_format', 'position', 'format')


# @admin.register(models.ElectionDate)
# class ElectionDateAdmin(admin.ModelAdmin):
#     pass


@admin.register(models.URLType)
class URLTypeAdmin(admin.ModelAdmin):
    pass

class ElectionResultAttachmentInline(admin.TabularInline):
    model = models.ElectionResultAttachment
    extra = 0


@admin.register(models.ElectionResult)
class ElectionResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'election', 'upload_by_user', 'uploader_name', 'uploader_phone', 'uploader_email', 'notes')
    inlines = (
        ElectionResultAttachmentInline,
    )

@admin.register(models.ElectionResultDownloadHistory)
class ElectionResultDownloadHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'downloaded_at', 'downloaded_by_user', 'elections_ids', 'elections_archive_file', 'election_result_attachment', 'status', 'error')
    pass

# @admin.register(models.URL)
# class URLAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.Feedback)
# class FeedbackAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.ContactPersonType)
# class ContactPersonTypeAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.ContactPerson)
# class ContactPersonAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.AddressType)
# class AddressTypeAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.Address)
# class AddressAdmin(admin.ModelAdmin):
#     pass


# @admin.register(models.Location)
# class LocationAdmin(admin.ModelAdmin):
#     pass
