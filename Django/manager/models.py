from __future__ import unicode_literals

import datetime
import re
import uuid
import pytz
from datetime import tzinfo

from django.utils.encoding import python_2_unicode_compatible
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from django.db.models import Q
from django.db import models
from timezone_field import TimeZoneField

from phonenumber_field.modelfields import PhoneNumberField

from electiongis import models as gismodels, consts as gconsts
from manager import consts
from manager.shortener import *


@python_2_unicode_compatible
class ElectionLevel(models.Model):

    class Meta:
        db_table = 'election_level'
        ordering = ['position']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)
    position = models.IntegerField(default=0)  # at the end of list default=2147483647

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class ElectionTypeDetail(models.Model):

    class Meta:
        db_table = 'election_type_detail'
        ordering = ['priority', 'name']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)
    priority = models.IntegerField()  # at the end of list default=2147483647

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class AdministrationLevel(models.Model):

    class Meta:
        db_table = 'election_administration_level'
        ordering = ['name']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class ElectionType(models.Model):

    class Meta:
        db_table = 'election_type'
        ordering = ['priority', 'name']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)
    priority = models.IntegerField()  # at the end of list default=2147483647

    def __str__(self):
        return self.name


class ElectionManager(models.Manager):

    def get_contact_emails_by_locations(self, locations):

        # select election IDs from the same locations as current election
        raw_election_ids = Location.objects.filter(geoid__in=locations).values_list('election', flat=True)

        # select trusted user
        trusted_users = User.objects.filter(Q(groups__name__in=['Results Manager']) |
            (Q(is_active=True) & (Q(is_staff=True) | Q(is_superuser=True))))

        contact_emails = Election.objects.filter(Q(use_user_email_as_contact_email=False) &
                Q(pk__in=raw_election_ids) &
                (Q(election_status__in=[consts.ELECTION_STATUS_APPROVED, consts.ELECTION_STATUS_ARCHIVED]) |
                 Q(user__in=trusted_users))
            ).exclude(contact_email='').values_list('contact_email', flat=True).distinct()

        return list(set(contact_emails))


    def get_contact_emails(self, election):
        raw_geoid_locations = election.locations.values_list('geoid', flat=True)
        return self.get_contact_emails_by_locations(raw_geoid_locations)



@python_2_unicode_compatible
class Election(models.Model):

    class Meta:
        db_table = 'election'
        ordering = ['election_date']
        default_permissions = (
            'add',
            'change',
            'delete',
            'view',
            'view_all', # access to all elections
            'send_request')

    objects = ElectionManager()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(User, related_name='+', on_delete=models.CASCADE)
    title = models.CharField(max_length=1024, help_text="Enter name of election exactly how it appears on your sample ballot.")
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=64)

    state_geoid = models.CharField(max_length=2, db_index=True)

    election_level = models.ForeignKey(ElectionLevel, null=True, related_name='+', on_delete=models.SET_NULL)
    election_type = models.ForeignKey(ElectionType, null=True, related_name='+', on_delete=models.SET_NULL)
    election_type_detail = models.ForeignKey(ElectionTypeDetail, null=True, related_name='+', on_delete=models.SET_NULL, blank=True)
    admin_level = models.ForeignKey(AdministrationLevel, null=True, related_name='+', on_delete=models.SET_NULL, blank=True)

    election_status = models.CharField(max_length=2, choices=consts.ELECTION_STATUSES, default=consts.ELECTION_STATUS_PENDING[0])
    election_day_registration_is_available = models.BooleanField(default=False)
    use_overseas_dates_as_military_dates = models.BooleanField(default=False)
    election_date = models.DateField()
    is_public = models.BooleanField(default=True)
    use_default_elections_website = models.BooleanField(default=True)
    use_user_email_as_contact_email = models.BooleanField(default=False)

    # How many times an email was sent for election results
    request_email_was_sent = models.IntegerField(default=0)
    request_email_was_sent_at = models.DateTimeField(blank=True, null=True)

    # extra information
    additional_information = models.TextField(blank=True, null=True)

    admin_first_name = models.CharField(max_length=64, blank=True, null=True)
    admin_last_name = models.CharField(max_length=64, blank=True, null=True)
    admin_email = models.EmailField(blank=True, null=True)
    admin_phone = models.CharField(max_length=64, blank=True, null=True)
    admin_title = models.CharField(max_length=3, choices=consts.ADMIN_TITLES, default=consts.ADMIN_TITLES_DEFAULT, blank=True, null=True)
    county_fips = models.CharField(max_length=36, blank=True, null=True)


    def get_election_state(self):
        return gismodels.State.objects.filter(geoid=self.state_geoid).get()


    def get_public_election_id(self):
        return encode_num(self.id)

    def get_contact_email(self):
        if self.use_user_email_as_contact_email:
            return self.user.email
        else:
            return self.contact_email

    def __str__(self):
        return self.title


@python_2_unicode_compatible
class ContactPersonType(models.Model):

    class Meta:
        db_table = 'contact_person_type'
        ordering = ['name']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class ContactPerson(models.Model):

    class Meta:
        db_table = 'contact_person'
        default_permissions = ('add', 'change', 'delete', 'view')

    contact_person_type = models.ForeignKey(ContactPersonType, null=True, related_name='+', on_delete=models.SET_NULL)
    election = models.ForeignKey(Election, related_name='contact_persons', on_delete=models.CASCADE)
    first_name = models.CharField(max_length=32, blank=True, null=True)
    last_name = models.CharField(max_length=32, blank=True, null=True)
    email = models.EmailField()
    phone = models.CharField(max_length=64, blank=True, null=True)
    fax = models.CharField(max_length=64, blank=True, null=True)
    other = models.TextField(blank=True, null=True)


@python_2_unicode_compatible
class AddressType(models.Model):

    class Meta:
        db_table = 'address_type'
        ordering = ['name']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class Address(models.Model):

    class Meta:
        db_table = 'address'
        default_permissions = ('add', 'change', 'delete', 'view')

    address_type = models.ForeignKey(AddressType, null=True, related_name='+', on_delete=models.SET_NULL)
    election = models.ForeignKey(Election, related_name='addresses', on_delete=models.CASCADE)

    address_1 = models.CharField(max_length=64)
    address_2 = models.CharField(max_length=64)
    address_3 = models.CharField(max_length=64)
    city = models.CharField(max_length=64)
    state = models.CharField(max_length=2, choices=consts.SHORT_TO_STATES, default=consts.SHORT_TO_STATES[0])

    zip = models.CharField(max_length=5, blank=True, null=True)
    zip_4 = models.CharField(max_length=4, blank=True, null=True)
    other_address_details = models.TextField()


@python_2_unicode_compatible
class Location(models.Model):

    class Meta:
        db_table = 'location'
        default_permissions = ('add', 'change', 'delete', 'view')

    election = models.ForeignKey(Election, related_name='locations', on_delete=models.CASCADE)
    # see consts.LOCATION_TYPE
    location_type = models.CharField(db_index=True, max_length=2, choices=gconsts.LOCATION_TYPE, default=gconsts.LOCATION_TYPE_UNKNOWN)
    geoid = models.CharField(max_length=12, db_index=True)
    name = models.CharField(max_length=128, db_index=True)

    def __str__(self):
        return '%s-%s' % (self.geoid, self.name)


def date_to_python(value):

    if isinstance(value, datetime.date):
        return value

    for format in consts.INPUT_DATE_FORMATS:
        try:
            return datetime.datetime.strptime('' + value, format).date()
        except (ValueError, TypeError):
            continue
    return None


def time_to_python(value):

    if isinstance(value, datetime.time):
        return value

    for format in ["%H:%M"]:
        try:
            return datetime.datetime.strptime('' + value, format).time()
        except (ValueError, TypeError):
            continue
    return None


def validate_timezone(value):
    if isinstance(value, tzinfo):
        return value

    try:
        tz = datetime.datetime.now(pytz.timezone(value)).strftime('%z')
        #return "%s/%s" % (value, tz)
        return value
    except (ValueError, TypeError):
        pass
    return None


@python_2_unicode_compatible
class ElectionDateType(models.Model):

    DEFAULT_ID = 1

    class Meta:
        db_table = 'election_date_type'
        ordering = ['position']
        default_permissions = ('add', 'change', 'delete', 'view')

    name = models.CharField(max_length=64)
    date_format = models.CharField(max_length=32, blank=True, null=True)
    time_format = models.CharField(max_length=32, blank=True, null=True)
    format = models.CharField(max_length=256)
    default = models.BooleanField(default=False)
    position = models.IntegerField(default=0)  # at the end of list default=2147483647

    @classmethod
    def get_default():
        return ElectionDateType.objects.filter(default=True).first()

    def _format_has_var(self, var):
        return self.format is not None and var in self.format

    def format_has_date(self):
        return self._format_has_var("{date}")

    def format_has_time(self):
        return self._format_has_var("{time}")

    def format_has_datetime(self):
        return self._format_has_var("{datetime}")

    def format_has_vars(self):
        return self.format_has_date() or self.format_has_time() or self.format_has_datetime()

    def render(self, date, time, time_zone):
        python_date = date_to_python(date)
        if python_date is None:
            if self.format_has_vars():
                return (None, "Please provide date and/or time")
            else:
                return (self.format, None)

        python_time = time_to_python(time)

        str_date = python_date.strftime(self.date_format) if python_date and self.date_format else None
        str_time = python_time.strftime(self.time_format) if python_time and self.time_format else None
        mixed_tz = validate_timezone(time_zone) if time_zone else None
        if str_time and mixed_tz:
            # we have date, time & time zone
            # reconstrcut time with time zone information
            python_time = datetime.datetime(
                year=python_date.year, month=python_date.month, day=python_date.day,
                hour=python_time.hour, minute=python_time.minute, second=python_time.second, microsecond=python_time.microsecond)

            if isinstance(mixed_tz, str):
                tz = pytz.timezone(mixed_tz)
            else:
                tz = mixed_tz
            str_time = tz.localize(python_time).strftime(self.time_format)

        str_datetime = None

        if str_date and str_time:
            str_datetime = " ".join([str_date, str_time])
        elif str_date:
            str_datetime = str_date
        elif str_time:
            str_datetime = str_time

        s = self.format
        s = s.replace("{date}", str_date if str_date else "")
        s = s.replace("{time}", str_time if str_time else "")
        s = s.replace("{datetime}", str_datetime if str_datetime else "")
        s = re.sub( '\s+', ' ', s).strip()  # replace multiple whitespace with single whitespace and strip traling space(s)
        return (s, None)

    def __str__(self):
        return self.name


@python_2_unicode_compatible
class ElectionDate(models.Model):
    class Meta:
        db_table = 'election_date'
        ordering = ['kind', 'date_type', 'date']
        default_permissions = ('add', 'change', 'delete', 'view')
        unique_together = ('election', 'kind', 'date_type')

    election = models.ForeignKey(Election, related_name='dates', on_delete=models.CASCADE)
    kind = models.CharField(max_length=4, choices=consts.ELECTION_DATES, default=consts.ELECTION_DATES[0])
    date_type = models.ForeignKey(ElectionDateType, related_name='+', on_delete=models.CASCADE, default=ElectionDateType.DEFAULT_ID)

    date = models.DateField(blank=True, null=True)
    time = models.TimeField(blank=True, null=True)
    time_zone = TimeZoneField(blank=True, choices=[(pytz.timezone(tz), tz) for tz in pytz.common_timezones if 'US' in tz])

    def __str__(self):
        date, error = self.date_type.render(self.date, self.time, self.time_zone)
        if error is not None:
            return error

        return date

    def formatted_date(self):
        dt = ""
        if self.date:
            dt = self.date.strftime("%B %d, %Y")

        tm = ""
        if self.time:
            tm = self.time.strftime("%H:%M")

        if self.date_type.format:
            s = self.date_type.format
            s = s.replace("{date}", dt)
            s = s.replace("{time}", tm)
            return s

        else:
            arr = []
            if dt:
                arr.append(dt)
            if tm:
                arr.append(tm)
            return " ".join(arr)

@python_2_unicode_compatible
class URLType(models.Model):
    class Meta:
        db_table = 'url_type'
        ordering = ['name']
        default_permissions = ('add', 'change', 'delete', 'view')

        verbose_name = 'URL Type'
        verbose_name_plural = 'URL Types'

    name = models.CharField(max_length=64)
    def __str__(self):
        return self.name


@python_2_unicode_compatible
class URL(models.Model):

    class Meta:
        db_table = 'url'
        ordering = ['url']
        default_permissions = ('add', 'change', 'delete', 'view')

    election = models.ForeignKey(Election, related_name='urls', on_delete=models.CASCADE)
    url_type = models.ForeignKey(URLType, related_name='+', on_delete=models.CASCADE)
    name = models.CharField(max_length=256, blank=True, null=True)
    url = models.URLField(max_length=1024)

    def __str__(self):
        return self.url


@python_2_unicode_compatible
class Feedback(models.Model):
    class Meta:
        db_table = 'feedback'
        default_permissions = ('add', 'change', 'delete', 'view')

    created_at = models.DateTimeField(auto_now_add=True)

    election = models.ForeignKey(Election, related_name='feedback', on_delete=models.CASCADE)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.notes


@python_2_unicode_compatible
class ElectionResult(models.Model):
    class Meta:
        db_table = 'election_result'
        default_permissions = ('add', 'change', 'delete', 'view')

    created_at = models.DateTimeField(auto_now_add=True)

    election = models.ForeignKey(Election, related_name='results', on_delete=models.CASCADE)

    # upload_by_user will be set if user is logged in in the website
    upload_by_user = models.ForeignKey(User, related_name='+', on_delete=models.CASCADE, blank=True, null=True)

    # if user is not authenticated we will ask the following fields
    uploader_name = models.CharField(max_length=255, blank=True)
    uploader_phone = PhoneNumberField(max_length=64, blank=True, null=True)
    uploader_email = models.EmailField(blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return '{0}'.format(self.election)


def upload_path(self, filename):
    parts = filename.rsplit('.', 1)
    extension = parts[1]
    random_chars = uuid.uuid4().__str__().split('-')[0]  # use first part of uuid
    name = '%s-%s.%s' % (parts[0], random_chars, extension)
    return 'election_results/{0}/{1}'.format(self.election_result.election.id, name)


@python_2_unicode_compatible
class ElectionResultAttachment(models.Model):
    class Meta:
        db_table = 'election_result_attachment'
        default_permissions = ('add', 'change', 'delete', 'view')

    created_at = models.DateTimeField(auto_now_add=True)
    election_result = models.ForeignKey(ElectionResult, related_name='attachments', on_delete=models.CASCADE)

    original_filename = models.CharField(max_length=1024, blank=True, null=True)
    file = models.FileField(upload_to=upload_path)

    def __str__(self):
        return '{0}'.format(self.original_filename)



def archive_path(self, filename):
    parts = filename.rsplit('.', 1)
    extension = parts[1]
    name = '%s-%s.%s' % (parts[0], datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S'), extension)
    return 'election_results/archives/{0}/{1}'.format(self.id, filename)


class ElectionResultDownloadHistory(models.Model):

    class Meta:
        db_table = 'election_result_download_history'
        default_permissions = ('add', 'change', 'delete', 'view')

        verbose_name = 'Election Results Download History'
        verbose_name_plural = 'Election Results Download History'


    created_at = models.DateTimeField(auto_now_add=True)
    downloaded_at = models.DateTimeField(blank=True, null=True)

    downloaded_by_user = models.ForeignKey(User, related_name='+', on_delete=models.CASCADE)

    # these fields will be initialize if user decided to download results for multiple elections
    # list of downloaded elections_ids
    elections_ids = JSONField(default=list)
    status = models.CharField(max_length=10, choices=[
        ('PENDING', 'PENDING'),
        ('PROCESSING', 'PROCESSING'),
        ('READY', 'READY'),
        ('ERROR', 'ERROR'),
    ], default='PENDING')
    error =  models.CharField(max_length=1024, blank=True, null=True)

    # archive file will have the following structure
    # \README.md
    # \Election Title0
    # \Election Title0\results_filename[0].ext
    # \Election Title0\results_filename[.].ext
    # \Election Title0\results_filename[n].ext

    # \Election Title1
    # \Election Title1\results_filename[0].ext
    # \Election Title1\results_filename[.].ext
    # \Election Title1\results_filename[n].ext
    elections_archive_file = models.FileField(upload_to=archive_path, blank=True, null=True)

    # this fileds will be initialize if user decided to download single file
    election_result_attachment = models.ForeignKey(ElectionResultAttachment, related_name='download_history', on_delete=models.CASCADE, blank=True, null=True)

