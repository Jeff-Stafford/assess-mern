# This script is used to migrate the data from old database into new EOD+LEDD
# This script may be removed once the production data is fully imported.
# In order to run import script, make sure `eod_legacy` database exists and includes data from production

import sys
import os
import re

from django.conf import settings
from django.db import transaction, connections
from django.db.models import Q
from django.db import models
from django.core.management.base import BaseCommand
from eod import models as new_eod


class LegacyAddress(models.Model):

    class Meta:
        db_table = 'addresses'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    address_to = models.CharField(max_length=255)
    street1 = models.CharField(max_length=255)
    street2 = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    zip = models.CharField(max_length=255)
    zip4 = models.CharField(max_length=255)


class LegacyLocalOfficial(models.Model):

    class Meta:
        db_table = 'local_officials'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    region = models.ForeignKey('LegacyVotingRegion')
    physical_address = models.ForeignKey(LegacyAddress)
    mailing_address = models.ForeignKey(LegacyAddress)

    dsn_phone = models.CharField(max_length=255)
    general_email = models.CharField(max_length=255)
    website = models.CharField(max_length=255)
    hours = models.CharField(max_length=255, blank=True)
    further_instruction = models.TextField(blank=True)
    status = models.IntegerField(blank=True, null=True)
    updated = models.DateTimeField()

    # ALL
    # UOCAVA
    # DOMESTIC
    local_office_type = models.CharField(max_length=255)

    officers = models.ManyToManyField('LegacyOfficer', through='LegacyLocalOfficialToOfficer')


class LegacyOfficer(models.Model):

    class Meta:
        db_table = 'officers'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    order_number = models.IntegerField(blank=True, null=True)
    office_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    initial = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    suffix = models.CharField(max_length=255)
    phone = models.CharField(max_length=255)
    fax = models.CharField(max_length=255)
    email = models.CharField(max_length=255)

    local_officials = models.ManyToManyField('LegacyLocalOfficial', through='LegacyLocalOfficialToOfficer')


class LegacyLocalOfficialToOfficer(models.Model):

    class Meta:
        db_table = 'local_officials_to_officers'
        app_label = 'legacy'

    local_official = models.ForeignKey(LegacyLocalOfficial, blank=True, null=True, primary_key=True)
    officer = models.ForeignKey(LegacyOfficer, blank=True, null=True)


class LegacyEodAdditionalAddress(models.Model):

    class Meta:
        db_table = 'eod_additional_address'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    type = models.ForeignKey('LegacyAdditionalAddressType')
    local_official = models.ForeignKey(LegacyLocalOfficial, related_name='additional_addresses')
    address = models.ForeignKey(LegacyAddress)
    ordering = models.IntegerField()
    email = models.EmailField(max_length=255, blank=True)
    website = models.URLField(max_length=255, blank=True)


class LegacyAdditionalAddressType(models.Model):
    class Meta:
        db_table = 'eod_additional_address_type'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True, blank=False, null=False)


class LegacyState(models.Model):

    class Meta:
        db_table = 'states'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    abbr = models.CharField(max_length=3)


class LegacyCounty(models.Model):

    class Meta:
        db_table = 'counties'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    county_type = models.CharField(max_length=255)
    state = models.ForeignKey(LegacyState, related_name='counties')


class LegacyMunicipality(models.Model):

    class Meta:
        db_table = 'municipalities'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    municipality_type = models.CharField(max_length=255)
    county = models.ForeignKey(LegacyCounty, related_name='municipalities', blank=True, null=True)
    state = models.ForeignKey(LegacyState, related_name='municipalities')


class LegacyVotingRegion(models.Model):

    class Meta:
        db_table = 'voting_regions'
        app_label = 'legacy'

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    state = models.ForeignKey(LegacyState, related_name='regions')
    municipality = models.ForeignKey(LegacyMunicipality, related_name='regions', blank=True, null=True)
    county = models.ForeignKey(LegacyCounty, related_name='regions', blank=True, null=True)


def is_dup_address(inner_address, outer_address):
    return inner_address.pk != outer_address.pk and outer_address.address_to == inner_address.address_to and \
        outer_address.street1 == inner_address.street1 and \
        outer_address.street2 == inner_address.street2 and \
        outer_address.city == inner_address.city and \
        outer_address.state == inner_address.state and \
        outer_address.zip == inner_address.zip and \
        outer_address.zip4 == inner_address.zip4


# Entrypoint
class Command(BaseCommand):



    def handle(self, *args, **options):

        new_eod.Address.objects.all().delete()
        new_eod.Officer.objects.all().delete()
        new_eod.AddressOfficer.objects.all().delete()

        new_eod.LocalOfficial.objects.all().delete()
        new_eod.VotingRegion.objects.all().delete()
        new_eod.State.objects.all().delete()
        new_eod.County.objects.all().delete()
        new_eod.Municipality.objects.all().delete()


        state_mapper = {}
        for state in LegacyState.objects.all():
            s = new_eod.State()
            s.name = state.name
            s.abbr = state.abbr
            s.save()
            state_mapper.update({state.pk: s.pk})

        # ===============================
        print("Done States. %s total." % new_eod.State.objects.count())
        # ===============================


        county_mapper = {}
        for county in LegacyCounty.objects.all():

            c = new_eod.County()
            c.name = county.name
            c.county_type = county.county_type
            c.state = new_eod.State.objects.get(pk=state_mapper.get(county.state.pk))
            c.save()
            county_mapper.update({county.pk: c.pk})

        # ===============================
        print("Done Counties. %s total." % new_eod.County.objects.count())
        # ===============================


        municipality_mapper = {}
        for municipality in LegacyMunicipality.objects.all():

            m = new_eod.Municipality()
            m.name = municipality.name
            m.municipality_type = municipality.municipality_type

            if municipality.county:
                m.county = new_eod.County.objects.get(pk=county_mapper.get(municipality.county.pk))

            m.state = new_eod.State.objects.get(pk=state_mapper.get(municipality.state.pk))
            m.save()
            municipality_mapper.update({municipality.pk: m.pk})

        # ===============================
        print("Done Municipalities. %s total." % new_eod.Municipality.objects.count())
        # ===============================


        voting_region_mapper = {}
        for reg in LegacyVotingRegion.objects.all():
            vr = new_eod.VotingRegion()
            vr.name = reg.name
            vr.state = new_eod.State.objects.get(pk=state_mapper.get(reg.state.pk))

            if reg.county:
                vr.county = new_eod.County.objects.get(pk=county_mapper.get(reg.county.pk))

            if reg.municipality:
                vr.municipality = new_eod.Municipality.objects.get(
                    pk=municipality_mapper.get(reg.municipality.pk))

            vr.save()
            voting_region_mapper.update({reg.pk: vr.pk})

        # ===============================
        print("Done Voting Regions. %s total." % new_eod.VotingRegion.objects.count())
        # ===============================


        officer_mapper = {}
        for officer in LegacyOfficer.objects.all():
            o = new_eod.Officer()
            o.order_number = officer.order_number
            o.office_name = officer.office_name
            o.title = officer.title
            o.suffix = officer.suffix
            o.first_name = officer.first_name
            o.last_name = officer.last_name
            o.initial = officer.initial
            o.last_name = officer.last_name

            phone_match = re.search(r"(\(\d{3}\) \d{3}( |-)?\d{4})?( \d+)?", officer.phone)
            if phone_match:
                if phone_match.group(1) and phone_match.group(3):
                    o.phone = "%s x%s" % (phone_match.group(1), phone_match.group(3).strip())
                elif phone_match.group(1):
                    o.phone = phone_match.group(1)
                else:
                    # fallback to unknown phone format
                    o.phone = officer.phone

            else:
                o.phone = officer.phone

            o.fax = officer.fax

            o.email = officer.email

            o.save()
            officer_mapper.update({officer.pk: o.pk})
        # ===============================
        print("Done Officers. %s total." % new_eod.Officer.objects.count())
        # ===============================


        local_official_mapper = {}
        for lo in LegacyLocalOfficial.objects.all():
            l = new_eod.LocalOfficial()
            l.updated = lo.updated
            l.hours = lo.hours
            l.further_instruction = lo.further_instruction
            l.status = lo.status
            l.geoid = ""
            l.region = new_eod.VotingRegion.objects.get(pk=voting_region_mapper.get(lo.region.pk))
            l.save()
            local_official_mapper.update({lo.pk: l.pk})
        # ===============================
        print("Done Local Officials. %s total." % new_eod.LocalOfficial.objects.count())
        # ===============================


        # Establish LocalOfficial and Officer relation
        for loo in LegacyLocalOfficialToOfficer.objects.all():

            local_official = new_eod.LocalOfficial.objects.get(pk=local_official_mapper.get(loo.local_official.pk))
            officer = new_eod.Officer.objects.get(pk=officer_mapper.get(loo.officer.pk))
            officer.local_official = local_official
            officer.save()

        # ===============================
        print("Done Officer vs. Local Official relations.")
        # ===============================


        # Establish Address and LocalOfficial relations
        for lo in LegacyLocalOfficial.objects.all():

            officers = [o.officer for o in LegacyLocalOfficialToOfficer.objects.filter(local_official=lo).all()]

            # ===========================
            # mailing address
            # ===========================
            address = lo.mailing_address
            a = new_eod.Address()
            a.order_number = 1000
            a.address_to = address.address_to
            a.street1 = address.street1
            a.street2 = address.street2
            a.city = address.city
            a.state = address.state
            a.zip = address.zip
            a.zip4 = address.zip4
            a.local_official = new_eod.LocalOfficial.objects.get(pk=local_official_mapper.get(lo.pk))
            a.website = lo.website

            try:
                legacy_contact = [o for o in officers if o.order_number==1][0]
                a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))
            except IndexError:
                # if no contact with order #1 we going to fall back to very first one contact.
                # to avoid leaving address w/o required primary contact, this is pretty much all what
                # we can possibly do.
                if any(officers):
                    legacy_contact = officers[0]
                    a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))

            a.main_phone_number = a.primary_contact.phone
            a.main_fax_number = a.primary_contact.fax

            if len(lo.general_email) > 0:
                a.main_email = lo.general_email
            else:
                a.main_email = a.primary_contact.email

            a.is_physical = False
            a.is_regular_mail = True

            if lo.local_office_type == "ALL":
                a.functions = [
                    'DOM_VR',
                    'DOM_REQ',
                    'DOM_RET',
                    'OVS_REQ',
                    'OVS_RET',
                    ]
            elif lo.local_office_type == "UOCAVA":
                a.functions = [
                    'OVS_REQ',
                    'OVS_RET',
                    ]
            elif lo.local_office_type == "DOMESTIC":
                a.functions = [
                    'DOM_VR',
                    'DOM_REQ',
                    'DOM_RET',
                    ]

            a.save()


            # ===========================
            # physical address
            # ===========================
            address = lo.physical_address
            a = new_eod.Address()
            a.order_number = 999
            a.address_to = address.address_to
            a.street1 = address.street1
            a.street2 = address.street2
            a.city = address.city
            a.state = address.state
            a.zip = address.zip
            a.zip4 = address.zip4
            a.local_official = new_eod.LocalOfficial.objects.get(pk=local_official_mapper.get(lo.pk))

            a.website = lo.website

            try:
                legacy_contact = [o for o in officers if o.order_number==1][0]
                a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))
            except IndexError:
                # if no contact with order #1 we going to fall back to very first one contact.
                # this is completelly ugly but this is pretty much what we possibly can do.
                if any(officers):
                    legacy_contact = officers[0]
                    a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))

            a.main_phone_number = a.primary_contact.phone
            a.main_fax_number = a.primary_contact.fax

            if len(lo.general_email) > 0:
                a.main_email = lo.general_email
            else:
                a.main_email = a.primary_contact.email

            a.is_physical = True
            a.is_regular_mail = False

            if lo.local_office_type == "ALL":
                if a.state in ["NJ", "AL"]:
                    a.functions = [
                        'DOM_REQ',
                        'DOM_RET',
                        'OVS_REQ',
                        'OVS_RET',
                        ]
                else:
                    a.functions = [
                        'DOM_VR',
                        'DOM_REQ',
                        'DOM_RET',
                        'OVS_REQ',
                        'OVS_RET',
                        ]
            elif lo.local_office_type == "UOCAVA":
                a.functions = [
                    'OVS_REQ',
                    'OVS_RET',
                    ]
            elif lo.local_office_type == "DOMESTIC":
                a.functions = [
                    'DOM_VR',
                    'DOM_REQ',
                    'DOM_RET',
                    ]

            a.save()


        for index, eod_ad in enumerate(LegacyEodAdditionalAddress.objects.all()):

            officers = [o.officer for o in LegacyLocalOfficialToOfficer.objects.filter(local_official=eod_ad.local_official).all()]

            # ===========================
            # additional address
            # ===========================
            address = eod_ad.address
            a = new_eod.Address()
            a.order_number = 998-index
            a.address_to = address.address_to
            a.street1 = address.street1
            a.street2 = address.street2
            a.city = address.city
            a.state = address.state
            a.zip = address.zip
            a.zip4 = address.zip4
            a.local_official = new_eod.LocalOfficial.objects.get(pk=local_official_mapper.get(eod_ad.local_official.pk))
            a.website = eod_ad.website

            try:
                legacy_contact = [o for o in officers if o.order_number==1][0]
                a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))
            except IndexError:
                # if no contact with order #1 we going to fall back to very first one contact.
                # this is completelly ugly but this is pretty much what we possibly can do.
                if any(officers):
                    legacy_contact = officers[0]
                    a.primary_contact = new_eod.Officer.objects.get(pk=officer_mapper.get(legacy_contact.pk))

            a.is_physical = True
            a.is_regular_mail = False

            a.main_phone_number = a.primary_contact.phone
            a.main_fax_number = a.primary_contact.fax

            if len(lo.general_email) > 0:
                a.main_email = lo.general_email
            else:
                a.main_email = a.primary_contact.email

            if eod_ad.type.name == "Vote-by-Mail (Absentee) Ballot Request Address":
                a.functions = [
                    'DOM_REQ',
                    ]
            elif eod_ad.type.name == "Voter Registration Mailing Address":
                a.functions = [
                    'DOM_VR',
                    ]
                a.is_physical = False
                a.is_regular_mail = True
            elif eod_ad.type.name == "Ballot Return Mailing Address":
                a.functions = [
                    'DOM_RET',
                    'OVS_RET',
                    ]
            else:
                a.functions = [
                    'DOM_VR',
                    'DOM_REQ',
                    'DOM_RET',
                    'OVS_REQ',
                    'OVS_RET',
                    ]


            a.save()

        # ===============================
        print("Done Address and LocalOfficial relations.")
        # ===============================


        # ===============================
        # Clean-up address dups. but merge address functions before removal.
        # ===============================
        for lo in new_eod.LocalOfficial.objects.all():
            all_lo_addresses = lo.addresses.all()
            address_ids_to_remove = []
            for outer_address in all_lo_addresses:
                for inner_address in [a for a in all_lo_addresses if outer_address.pk not in address_ids_to_remove]:
                    if is_dup_address(inner_address, outer_address):
                        # merge functions
                        outer_address.functions = list(set(outer_address.functions + inner_address.functions))
                        outer_address.is_physical = outer_address.is_physical or inner_address.is_physical
                        outer_address.is_regular_mail = outer_address.is_regular_mail or inner_address.is_regular_mail
                        outer_address.save()

                        # mark address for removal
                        address_ids_to_remove.append(inner_address.pk)

            if any(address_ids_to_remove):
                new_eod.Address.objects.filter(pk__in=address_ids_to_remove).delete()

        # ===============================
        print("Done cleaning address duplications.")
        # ===============================
