from django.contrib import admin

from eod import models


"""
Copyright 2011 Mathijs de Bruin
"""
class LimitedAdminInlineMixin(object):
    """
    InlineAdmin mixin limiting the selection of related items according to
    criteria which can depend on the current parent object being edited.
    A typical use case would be selecting a subset of related items from
    other inlines, ie. images, to have some relation to other inlines.
    Use as follows::
        class MyInline(LimitedAdminInlineMixin, admin.TabularInline):
            def get_filters(self, obj):
                return (('<field_name>', dict(<filters>)),)
    """

    @staticmethod
    def limit_inline_choices(formset, field, empty=False, **filters):
        """
        This function fetches the queryset with available choices for a given
        `field` and filters it based on the criteria specified in filters,
        unless `empty=True`. In this case, no choices will be made available.
        """
        assert field in formset.form.base_fields

        qs = formset.form.base_fields[field].queryset
        if empty:
            formset.form.base_fields[field].queryset = qs.none()
        else:
            qs = qs.filter(**filters)

            formset.form.base_fields[field].queryset = qs

    def get_formset(self, request, obj=None, **kwargs):
        """
        Make sure we can only select variations that relate to the current
        item.
        """
        formset = \
            super(LimitedAdminInlineMixin, self).get_formset(request,
                                                             obj,
                                                             **kwargs)

        for (field, filters) in self.get_filters(obj):
            if obj:
                self.limit_inline_choices(formset, field, **filters)
            else:
                self.limit_inline_choices(formset, field, empty=True)

        return formset

    def get_filters(self, obj):
        """
        Return filters for the specified fields. Filters should be in the
        following format::
            (('field_name', {'categories': obj}), ...)
        For this to work, we should either override `get_filters` in a
        subclass or define a `filters` property with the same syntax as this
        one.
        """
        return getattr(self, 'filters', ())


from django.forms import ModelChoiceField
class MunicipalityModelChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        return "%s %s %s, %s state" % (obj.name, obj.municipality_type, obj.county, obj.state)


class CountyModelChoiceField(ModelChoiceField):
    def label_from_instance(self, obj):
        return "%s %s, %s state" % (obj.name, obj.county_type, obj.state)


class CountyModelChoiceFieldWithoutState(ModelChoiceField):
    def label_from_instance(self, obj):
        return "%s %s, %s" % (obj.name, obj.county_type, obj.state)


@admin.register(models.State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'abbr')


@admin.register(models.County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'county_type', 'state')
    search_fields = ('name',)
    list_filter = ('county_type', 'state',)


@admin.register(models.Municipality)
class MunicipalityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'municipality_type', 'county', 'state')
    search_fields = ('name', )
    list_filter = ('state', 'municipality_type', 'county', )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'county':
            return CountyModelChoiceFieldWithoutState(queryset=models.County.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


from django import forms
class VotingRegionForm(forms.ModelForm):

    class Meta:
        model = models.VotingRegion
        fields = ('id', 'name', 'municipality', 'county', 'state')

    def clean(self):
        county = self.cleaned_data.get("county")
        municipality = self.cleaned_data.get("municipality")

        if county:
            if county.state != self.cleaned_data.get("state"):
                raise forms.ValidationError("Please make sure County and Voting Region States are the same.")

        if municipality:
            if municipality.state != self.cleaned_data.get("state"):
                raise forms.ValidationError("Please make sure Municipality and Voting Region States are the same.")


@admin.register(models.VotingRegion)
class VotingRegionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'municipality', 'county', 'state')
    search_fields = ('name', )
    list_filter = ('state', 'municipality', 'county', )
    form = VotingRegionForm

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "municipality":
            return MunicipalityModelChoiceField(queryset=models.Municipality.objects.all(), required=(len(request.resolver_match.args) == 0))

        if db_field.name == "county":
            return CountyModelChoiceField(queryset=models.County.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class AddressAdminInline(admin.TabularInline):
    model = models.Address
    exclude = ['primary_contact']
    extra = 0

class OfficerAdminInline(admin.TabularInline):
    model = models.Officer
    extra = 0

@admin.register(models.LocalOfficial)
class LocalOfficialAdmin(admin.ModelAdmin):
    list_display = ('id', 'updated', 'region', 'type', 'hours', 'status', 'geoid')
    inlines = (AddressAdminInline, OfficerAdminInline, )


@admin.register(models.Officer)
class OfficerAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_number', 'office_name', 'title', 'suffix', 'first_name', 'initial', 'last_name', 'phone', 'fax', 'email', )

class AddressOfficerAdminInline(admin.TabularInline):
    model = models.AddressOfficer
    extra = 0

    def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
        field = super(AddressOfficerAdminInline, self).formfield_for_foreignkey(db_field, request, **kwargs)
        if (db_field.name == 'officer'):
            if request._obj_ is not None:
                officer_ids = set(models.Officer.objects.filter(local_official=request._obj_.local_official).values_list('id', flat=True))
                field.queryset = field.queryset.filter(id__in=officer_ids)
                field.label_from_instance = lambda obj: "%s (%s %s)" % (obj.office_name, obj.last_name, obj.first_name)
            else:
                field.queryset = field.queryset.none()
        else:
            field.queryset = field.queryset.none()
        return field

@admin.register(models.Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('id', 'address_to', 'street1', 'street2', 'city', 'state', 'zip', 'zip4', 'website')
    search_fields = ('address_to', 'street1', 'street2', 'city', 'state', 'zip', 'zip4', 'website')
    list_filter = ('state',)
    inlines = (AddressOfficerAdminInline,)
    exclude = ['local_official']

    def get_form(self, request, obj=None, **kwargs):
        # just save obj reference for future processing in Inline
        request._obj_ = obj
        return super(AddressAdmin, self).get_form(request, obj, **kwargs)

    def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
        field = super(AddressAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
        if (db_field.name == 'primary_contact'):
            if request._obj_ is not None:
                officer_ids = set(models.AddressOfficer.objects.filter(address=request._obj_).values_list('officer_id', flat=True))
                field.queryset = field.queryset.filter(id__in=officer_ids)
                field.label_from_instance = lambda obj: "%s (%s %s)" % (obj.office_name, obj.last_name, obj.first_name)
            else:
                field.queryset = field.queryset.none()
        else:
            field.queryset = field.queryset.none()
        return field
