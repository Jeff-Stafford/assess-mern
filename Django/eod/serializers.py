import copy
import datetime, pytz

from django.core.urlresolvers import reverse
from django.db.models import Prefetch
from django.core.cache import cache

from eod import models

from rest_framework import serializers
from eod import phaseone_hacks

class StateSerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:state-detail', read_only=True)

    class Meta:
        model = models.State
        fields = ('id', 'name', 'abbr', 'resource_uri')


class CountySerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:county-detail', read_only=True)
    state = serializers.SerializerMethodField()

    class Meta:
        model = models.County
        fields = ('id', 'name', 'county_type', 'resource_uri', 'state')

    def get_state(self, obj):
        return self.context['request'].build_absolute_uri(reverse('eod:state-detail',
            kwargs={'pk': obj.state.pk}))

class MunicipalitySerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:municipality-detail', read_only=True)
    state = serializers.SerializerMethodField()
    county = serializers.SerializerMethodField()

    class Meta:
        model = models.Municipality
        fields = ('id', 'name', 'municipality_type', 'resource_uri', 'state', 'county')

    def get_state(self, obj):
        return self.context['request'].build_absolute_uri(reverse('eod:state-detail',
            kwargs={'pk': obj.state.pk}))

    def get_county(self, obj):
        return self.context['request'].build_absolute_uri(reverse('eod:county-detail',
            kwargs={'pk': obj.county.pk}))

class VotingRegionSerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:votingregion-detail', read_only=True)

    class Meta:
        model = models.VotingRegion
        fields = ('id', 'resource_uri')

    # def get_customField(self, obj):
    #     return "cf: %s" % obj

    def to_representation(self, instance):
        ret = super(VotingRegionSerializer, self).to_representation(instance)
        ret['region_name'] = instance.name

        m = instance.municipality
        ret['municipality'] = self.context['request'].build_absolute_uri(reverse('eod:municipality-detail', kwargs={'pk': m.pk})) if m else None
        ret['municipality_name'] = m.name if m else None
        ret['municipality_type'] = m.municipality_type if m else None

        s = instance.state
        ret['state'] = self.context['request'].build_absolute_uri(reverse('eod:state-detail', kwargs={'pk': s.pk})) if s else None
        ret['state_abbr'] = s.abbr if s else None
        ret['state_name'] = s.name if s else None

        c = instance.county
        ret['county'] = self.context['request'].build_absolute_uri(reverse('eod:county-detail', kwargs={'pk': c.pk})) if c else None
        ret['county_name'] = c.name if c else None
        return ret


class OfficerSerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:officer-detail', read_only=True)
    office_type = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    office_uri = serializers.HyperlinkedRelatedField(source='local_official', view_name='eod:localofficial-detail', read_only=True)

    class Meta:
        model = models.Officer
        fields = ('id', 'office_type', 'title', 'suffix', 'first_name', 'initial', 'last_name', 'email', 'phone', 'fax', 'office_uri', 'resource_uri',)

    def get_title(self, obj):
        return obj.office_name

    def get_office_type(self, obj):
        if obj.order_number <= 1:
            return 'primary'
        elif obj.order_number == 2:
            return 'secondary'
        return 'additional';


class AddressOfficerSerializer(serializers.HyperlinkedModelSerializer):
    address_uri = serializers.HyperlinkedRelatedField(source='address', view_name='eod:address-detail', read_only=True)
    official_uri = serializers.HyperlinkedRelatedField(source='officer', view_name='eod:officer-detail', read_only=True)

    class Meta:
        model = models.AddressOfficer
        fields = ('id', 'address_uri', 'official_uri',)


class AddressSerializer(serializers.HyperlinkedModelSerializer):
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:address-detail', read_only=True)
    primary_contact_uri = serializers.HyperlinkedRelatedField(source='primary_contact', view_name='eod:officer-detail', read_only=True)
    contacts = AddressOfficerSerializer(source='address_officers', many=True, read_only=True)
    state = serializers.SerializerMethodField()

    class Meta:
        model = models.Address
        fields = (
            'id', 'address_to', 'street1', 'street2', 'city', 'state', 'zip', 'zip4', 'website',
            'is_physical', 'is_regular_mail', 'functions', 'primary_contact_uri', 'contacts',
            'resource_uri', 'main_email', 'main_phone_number', 'main_fax_number'
            )


    def get_state(self, obj):
        return obj.local_official.region.state.abbr


class LocalOfficialSerializer(serializers.HyperlinkedModelSerializer):
    
    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:localofficial-detail', read_only=True)
    notes = serializers.CharField(source='further_instruction')
    region = serializers.HyperlinkedRelatedField(view_name='eod:votingregion-detail', read_only=True)

    officials = OfficerSerializer(source="officers", many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = models.LocalOfficial
        fields = (
            'id',
            'updated',
            'region',  
            'hours',
            'notes',
            'status',
            'addresses',
            'officials',
            'resource_uri',
            'geoid',
            'type',
        )


class OfficerSerializer(serializers.HyperlinkedModelSerializer):

    resource_uri = phaseone_hacks.HyperlinkedIdentityField(view_name='eod:officer-detail', read_only=True)
    office_type = serializers.SerializerMethodField()
    office = phaseone_hacks.SingleOffice(source='local_official', view_name='eod:localofficial-detail', many=False, read_only=True)

    class Meta:
        model = models.Officer
        fields = ('id', 'office_type', 'office_name', 'title', 'suffix', 'first_name', 'initial', 'last_name', 'email', 'phone', 'fax', 'office', 'resource_uri',)


    def get_office_type(self, obj):
        if obj.order_number <= 1:
            return 'primary'
        elif obj.order_number == 2:
            return 'secondary'
        return 'additional';
