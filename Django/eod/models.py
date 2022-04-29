from __future__ import unicode_literals
import inspect
import uuid
import logging
import traceback
from enum import Enum

from django import forms
from django.utils import timezone
from django.contrib import admin
from django.contrib.postgres.fields import JSONField, ArrayField
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import signals
from django.db.models import Lookup
from django.dispatch.dispatcher import receiver
from django_fsm.signals import pre_transition, post_transition

from django_fsm import FSMField, FSMIntegerField, transition, RETURN_VALUE, GET_STATE


from eod import json

logger = logging.getLogger(__name__)


# support __ne filter
class NotEqual(Lookup):
    lookup_name = 'ne'
    def as_sql(self, qn, connection):
        lhs, lhs_params = self.process_lhs(qn, connection)
        rhs, rhs_params = self.process_rhs(qn, connection)
        params = lhs_params + rhs_params
        return '%s <> %s' % (lhs, rhs), params
from django.db.models.fields import Field
Field.register_lookup(NotEqual)


class ChoiceEnum(object):
    @classmethod
    def choices(cls):
        if not hasattr(cls, '__choices'):
            cls._build_meta()
        return getattr(cls, '__choices')

    @classmethod
    def has(cls, item):
        if not hasattr(cls, '__keys'):
            cls._build_meta()
        return item in getattr(cls, '__keys')

    @classmethod
    def _build_meta(cls):
        members = inspect.getmembers(cls, lambda m: not(inspect.isroutine(m)))
        # filter down to just properties
        props = [m for m in members if not(m[0][:2] == '__')]
        # format into django choice tuple
        choices = tuple([(str(p[1]), p[0]) for p in props])
        setattr(cls, '__choices', choices)

        keys = {k: v for (k, v) in choices}
        setattr(cls, '__keys', keys)



# Tables from usvotefoudnation
class State(models.Model):

    class Meta:
        db_table = 'states'
        ordering = ['name']

    name = models.CharField(max_length=255)
    abbr = models.CharField(max_length=3)

    def __str__(self):
        return self.name


class County(models.Model):

    class Meta:
        db_table = 'counties'
        ordering = ['name']

    name = models.CharField(max_length=255)
    county_type = models.CharField(max_length=255)
    state = models.ForeignKey(State, related_name='counties')

    def __str__(self):
        return self.name


class Municipality(models.Model):

    class Meta:
        db_table = 'municipalities'
        ordering = ['name']

    name = models.CharField(max_length=255)
    municipality_type = models.CharField(max_length=255)
    county = models.ForeignKey(County, related_name='municipalities', blank=True, null=True)
    state = models.ForeignKey(State, related_name='municipalities')

    def __str__(self):
        return self.name


class VotingRegion(models.Model):

    class Meta:
        db_table = 'voting_regions'
        ordering = ['name']

    name = models.CharField(max_length=255)
    state = models.ForeignKey(State, related_name='regions')

    county = models.ForeignKey(County, related_name='regions', blank=True, null=True)
    municipality = models.ForeignKey(Municipality, related_name='regions', blank=True, null=True)

    def __str__(self):
        return self.name


class Address(models.Model):

    FUNCTIONS = [
            {
                'title': 'Domestic Voters',
                'functions': [
                    {
                        'title': 'Voter Registration',
                        'code': 'DOM_VR',
                    },
                    {
                        'title': 'Vote-by-Mail (Absentee) Ballot Request Address',
                        'code': 'DOM_REQ',
                    },
                    {
                        'title': 'Vote-by-Mail (Absentee) Ballot Return Address',
                        'code': 'DOM_RET',
                    },
                ]
            },
            {
                'title': 'Overseas/Military Voters',
                'functions': [
                    {
                        'title': 'Registration/Ballot Request Address',
                        'code': 'OVS_REQ',
                    },
                    {
                        'title': 'Vote-by-Mail (Absentee) Ballot Return Address',
                        'code': 'OVS_RET',
                    },
                ]
            },
        ]

    class Meta:
        db_table = 'addresses'
        ordering = ['order_number',]


    order_number = models.IntegerField(default=0)
    address_to = models.CharField(max_length=255, blank=True)
    street1 = models.CharField(max_length=255, blank=True)
    street2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=3, blank=True)
    zip = models.CharField(max_length=6, blank=True)
    zip4 = models.CharField(max_length=5, blank=True)
    website = models.URLField(max_length=255, blank=True)
    is_physical = models.BooleanField(blank=False)
    is_regular_mail = models.BooleanField(blank=False)
    functions = ArrayField(models.CharField(max_length=50), default=[], blank=True)

    primary_contact = models.ForeignKey('Officer', related_name='primary_contact_addresses', blank=True, null=True)
    local_official = models.ForeignKey('LocalOfficial', related_name='addresses', blank=True, null=True)
    officers = models.ManyToManyField('Officer', through='AddressOfficer')

    main_email = models.CharField(max_length=255, blank=True)
    main_phone_number = models.CharField(max_length=255, blank=True)
    main_fax_number = models.CharField(max_length=255, blank=True)

    updated = models.DateTimeField(blank=False, null=True)


    def touch(self):
        self.updated = timezone.now()


    def __str__(self):
        addrs = ["%s" % d for d in (self.address_to, self.street1, self.street2, self.city, self.state, ) if d]
        if self.zip and self.zip4:
            addrs.append("%s-%s" % (self.zip, self.zip4))
        elif self.zip:
            addrs.append("%s" % (self.zip))

        return ", ".join(addrs)

    def to_dict(self):

        if self.primary_contact is not None:
            primary_contact = self.primary_contact.to_dict()
        else:
            primary_contact = None

        return dict(
            id=self.pk,
            address_to=self.address_to,
            street1=self.street1,
            street2=self.street2,
            city=self.city,
            state=self.state,
            zip=self.zip,
            zip4=self.zip4,
            website=self.website,
            main_email=self.main_email,
            main_phone_number=self.main_phone_number,
            main_fax_number=self.main_fax_number,
            is_physical=self.is_physical,
            is_regular_mail=self.is_regular_mail,
            additional_contacts=[officer.to_dict() for officer in self.officers.all()],
            primary_contact=primary_contact,
            functions=self.functions,
        )

class AddressOfficer(models.Model):

    class Meta:
        managed = True
        db_table = 'address_officer'

    address = models.ForeignKey('Address', related_name='address_officers', blank=False)
    officer = models.ForeignKey('Officer', related_name='officer_addresses', blank=False)


class LocalOfficialType(ChoiceEnum):
    ALL      = 'All'
    UOCAVA   = 'UOCAVA'
    DOMESTIC = 'Domestic'


class LocalOfficial(models.Model):

    class Meta:
        db_table = 'local_officials'
        ordering = ['region__name',]

    updated = models.DateTimeField()
    region = models.ForeignKey(VotingRegion, related_name='address')  # one-to-one
    hours = models.CharField(max_length=255, blank=True)
    further_instruction = models.TextField(blank=True)
    status = models.IntegerField(blank=True, null=True)
    geoid = models.CharField(max_length=255, blank=True)
    type = FSMField(choices=LocalOfficialType.choices(), default=LocalOfficialType.ALL)

    # here "open" correction means the correction that was submitted by the public representative and was not
    # processed by the admin yet.
    def has_open_corrections(self):
        if self.has_corrections():
            statuses = [s.status for s in self.corrections.all()]
            print(statuses)
            if CorrectionStatus.CORRECTION_SUBMITTED_UPDATES in statuses:
                return True
        else:
            return False

    def has_corrections(self):
        return self.corrections.all() and self.corrections.all()[0]

    def to_dict(self):
        return dict(
            general=dict(
                id=self.id,
                further_instruction=self.further_instruction,
                hours=self.hours,
                type=self.type,
            ),
            addresses=[addr.to_dict() for addr in self.addresses.order_by('order_number').all()],
            officers=[officer.to_dict() for officer in self.officers.order_by('order_number').all()],
        )

    def last_updated(self):
        return max([d for d in [self.updated] + [a.updated for a in self.addresses.all()] + [o.updated for o in self.officers.all()] if d])

    def last_updated_date(self):
        most_recent =  max([d for d in [self.updated] + [a.updated for a in self.addresses.all()] + [o.updated for o in self.officers.all()] if d])
        if most_recent:
            return most_recent.strftime("%D")
        else:
            return None

    def touch(self):
        self.updated = timezone.now()


class Officer(models.Model):

    class Meta:
        db_table = 'officers'
        ordering = ['order_number',]

    order_number = models.IntegerField(default=0)
    office_name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255, blank=True)
    suffix = models.CharField(max_length=255, blank=True)
    first_name = models.CharField(max_length=255, blank=True)
    initial = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=255, blank=True)
    fax = models.CharField(max_length=255, blank=True)
    email = models.EmailField(max_length=255, blank=True)
    addresses = models.ManyToManyField('Officer', through='AddressOfficer')
    local_official = models.ForeignKey('LocalOfficial', related_name='officers', blank=False, null=True)

    updated = models.DateTimeField(blank=False, null=True)


    def touch(self):
        self.updated = timezone.now()


    def to_dict(self):
        return dict(id=self.pk,
            office_name=self.office_name,
            email=self.email,
            phone=self.phone if self.phone else '',
            fax=self.fax if self.fax else '',
            first_name=self.first_name,
            last_name=self.last_name,)


    def full_name(self):
        return "{}".format(self.office_name)


# Correction models
# Keep iteraction status with any LEO
class CorrectionStatus(ChoiceEnum):
    ERROR                           = 'ERROR'

    #
    INITIAL                         = 'INITIAL'

    # The email has been scheduled for sending
    EMAIL_SCHEDULED                 = 'EMAIL_SCHEDULED'

    # Email has been sent
    EMAIL_SENT                      = 'EMAIL_SENT'

    # Email has been bounced
    EMAIL_REJECTED_BOUNCE           = 'EMAIL_REJECTED_BOUNCE'
    EMAIL_REJECTED_COMPLAINT        = 'EMAIL_REJECTED_COMPLAINT'
    EMAIL_FOLLOWUP_SCHEDULED        = 'EMAIL_FOLLOWUP_SCHEDULED'

    # Correction request is expired, need to send follow up email
    EMAIL_EXPIRED                   = 'EMAIL_EXPIRED'

    # The follow up email has been sent after 2 weeks
    EMAIL_FOLLOWUP_SENT             = 'EMAIL_FOLLOWUP_SENT'
    # No response after 4 weeks (1st and 2nd emails are just ignored)
    EMAIL_NO_RESPONSE               = 'EMAIL_NO_RESPONSE'
    # Correction submitted without any changes
    CORRECTION_SUBMITTED_NO_UPDATES = 'CORRECTION_SUBMITTED_NO_UPDATES'

    # Correction submitted with changes
    CORRECTION_SUBMITTED_UPDATES    = 'CORRECTION_SUBMITTED_UPDATES'

    # Corrections are accepted by moderator
    CORRECTION_ACCEPTED             = 'CORRECTION_ACCEPTED'

    # Correction are rejected by moderator
    CORRECTION_REJECTED             = 'CORRECTION_REJECTED'
    CORRECTION_FOLLOWUP_SENT        = 'CORRECTION_FOLLOWUP_SENT'


    def human_status(status, status_context=None):
        if not CorrectionStatus.has(status):
            return ''

        if status == 'ERROR':
            if status_context and 'type' in status_context:
                if status_context['type'] == 'error':
                    return 'Error: %s' % (','.join(status_context['errors']))
            else:
                return 'Error'

        elif status == 'INITIAL':
            return 'Ready to Send.'

        elif status == 'CORRECTION_SUBMITTED_NO_UPDATES':
            return 'No Changes Submitted.'

        elif status == 'CORRECTION_SUBMITTED_UPDATES':
            return 'Corrections Have Been Submitted.'

        elif status == 'CORRECTION_ACCEPTED':
            return 'Correction Accepted.'

        elif status == 'CORRECTION_REJECTED':
            return 'Correction Rejected.'

        elif status == 'EMAIL_SENT':
            if 'email_to' in status_context and status_context['email_to']:
                return 'Snapshot Sent to %s' % status_context['email_to']
            else:
                return 'Snapshot Sent.'

        elif status == 'EMAIL_SCHEDULED':
            return 'Email is Queued for Sending.'

        elif status == 'EMAIL_REJECTED_BOUNCE':
            if 'email_to' in status_context and status_context['email_to']:
                return 'Email %s Has Bounced.' % status_context['email_to']
            else:
                return 'Email has Bounced.'

        elif status == 'EMAIL_REJECTED_COMPLAINT':
            if 'email_to' in status_context and status_context['email_to']:
                return 'Complaint Email %s' % status_context['email_to']
            else:
                return 'Complaint Email.'

        return '%s' % status.replace('_', ' ').capitalize()


class LocalOfficialCorrection(models.Model):
    class Meta:
        db_table = 'correction'
        ordering = ['-updated_at']
        default_permissions = ('add', 'change', 'delete', 'view')

    local_official = models.ForeignKey(LocalOfficial, related_name='corrections', on_delete=models.CASCADE)
    request_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    status = FSMField(choices=CorrectionStatus.choices(), default=CorrectionStatus.INITIAL)
    status_context = JSONField(default=dict, encoder=json.JSONEncoder)

    user = models.IntegerField(blank=True, null=True)
    is_system = models.BooleanField(default=True)


    def human_status(self):
        return CorrectionStatus.human_status(self.status, self.status_context)


    def __getattr__(self, name):
        if name and name[:10] == "is_status_":
            s = name[10:].upper()
            try:
                return self.status == s and s in CorrectionStatus.__dict__
            except KeyError:
                pass
        raise AttributeError


    def _set_status_context(self, context_type, error):
        self.status_context = {
            'type': context_type,
            'error': error,
        }

    def set_exception(self, error):
        self._set_status_context('exception', error)


    def set_error(self, error):
        self._set_status_context('error', error)

    def _collect_stats(self, results):
        if results is None:
            results = []
        total_sent = 0
        errors = []
        for sent, error in results:
            if sent:
                total_sent += 1
            else:
                errors.append(error['error'])
        return (total_sent, len(errors), errors)


    @transition(field=status,
        source=(CorrectionStatus.EMAIL_SCHEDULED, CorrectionStatus.INITIAL,),
        target=RETURN_VALUE(CorrectionStatus.EMAIL_SENT, CorrectionStatus.ERROR,))
    def send_email(self, result=None):
        """
        Send first email to local official
        """
        sent, context = result
        if sent:
            self.status_context = context
            return CorrectionStatus.EMAIL_SENT
        self.set_exception(context)
        return CorrectionStatus.ERROR


    @transition(field=status,
        source=CorrectionStatus.EMAIL_SENT,
        target=CorrectionStatus.EMAIL_REJECTED_BOUNCE)
    def email_bounced(self, context=None):
        if context:
            self.status_context = context


    @transition(field=status,
        source=CorrectionStatus.EMAIL_SENT,
        target=CorrectionStatus.EMAIL_REJECTED_COMPLAINT)
    def email_complaint(self, context=None):
        if context:
            self.status_context = context


    @transition(field=status,
        source=CorrectionStatus.EMAIL_SENT,
        target=CorrectionStatus.EMAIL_EXPIRED)
    def email_expired(self):
        pass


    @transition(field=status,
        source='*',
        target=CorrectionStatus.CORRECTION_SUBMITTED_NO_UPDATES)
    def correction_submitted_without_updates(self, data):
        self.status_context = data
        return CorrectionStatus.CORRECTION_SUBMITTED_NO_UPDATES


    @transition(field=status,
        source='*',
        target=CorrectionStatus.CORRECTION_SUBMITTED_UPDATES)
    def correction_submitted_with_updates(self, data):
        self.status_context = data
        return CorrectionStatus.CORRECTION_SUBMITTED_UPDATES


    @transition(field=status,
        source=(CorrectionStatus.CORRECTION_SUBMITTED_UPDATES,),
        target=RETURN_VALUE(
            CorrectionStatus.CORRECTION_ACCEPTED,
            CorrectionStatus.CORRECTION_REJECTED,))

    def accept_corrections(self, accepted, accepted_corrections=None):
        if accepted:
            self.status_context = accepted_corrections
            return CorrectionStatus.CORRECTION_ACCEPTED

        return CorrectionStatus.CORRECTION_REJECTED


    @transition(field=status,
        source=CorrectionStatus.EMAIL_FOLLOWUP_SCHEDULED,
        target=CorrectionStatus.EMAIL_FOLLOWUP_SENT)
    def send_followup_email(self):
        email.send_followup_email()
        pass


    @transition(field=status,
        source=CorrectionStatus.ERROR,
        target=CorrectionStatus.EMAIL_SCHEDULED)
    def reschedule_email(self):
        pass


    def __str__(self):
        return "id=%s, loc_id=%s, request_id='%s', status='%s'" % (self.pk, self.local_official.pk, self.request_id, self.status)


class LocalOfficialCorrectionHistory(models.Model):

    class Meta:
        db_table = 'correction_history'
        ordering = ['-created_at']
        default_permissions = ('add', 'change', 'delete', 'view')

    local_official = models.ForeignKey(LocalOfficial, related_name='correction_history', on_delete=models.CASCADE)
    local_official_correction = models.ForeignKey(LocalOfficialCorrection, related_name='correction_history', on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)

    status = FSMField(default=CorrectionStatus.INITIAL)
    status_context = JSONField(default=dict, encoder=json.JSONEncoder)

    user = models.IntegerField(blank=True, null=True)
    is_system = models.BooleanField(default=True)


    def human_status(self):
        return CorrectionStatus.human_status(self.status, self.status_context)


    def __str__(self):
        return "id=%s, status='%s'" % (self.local_official.pk, self.status)


class SchedulerStatus(ChoiceEnum):
    MANUAL  = 1
    CRON    = 2


class SchedulerSettings(models.Model):

    local_official = models.OneToOneField(LocalOfficial,
        on_delete=models.CASCADE,
        primary_key=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    status = FSMIntegerField(default=SchedulerStatus.MANUAL)
    status_message = models.CharField(max_length=256)

    cron_settings = JSONField(default=dict, encoder=json.JSONEncoder)


    def set_status(self, status, message=''):
        self.status=status
        self.status_message=message



# Create new LocalOfficialCorrection and SchedulerSettings for each new local official
def create_leo_settings_signal(sender, instance, created, **kwargs):
    if created:
        (leo_correction, leo_correction_created) = LocalOfficialCorrection.objects.get_or_create(local_official=instance)
        if leo_correction_created:
            leo_correction.save()

        (scheduler_settings, scheduler_settings_created) = SchedulerSettings.objects.get_or_create(local_official=instance)
        if scheduler_settings_created:
            scheduler_settings.save()


signals.post_save.connect(create_leo_settings_signal,
    sender=LocalOfficial,
    dispatch_uid='local_official.create_leo_settings_signal')


@receiver(pre_transition)
def log_correction_update(*args, **kwargs):
    source = kwargs.pop('source')
    target = kwargs.pop('target')
    if source == target:
        return

    instance = kwargs.pop('instance')
    LocalOfficialCorrectionHistory.objects.create(
        local_official=instance.local_official,
        local_official_correction=instance,
        status=instance.status,
        status_context=instance.status_context,
        user=instance.user,
        is_system=instance.is_system)
