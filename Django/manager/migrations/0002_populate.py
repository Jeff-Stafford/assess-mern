# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

def populate_election_level(apps, schema):
    ELECTION_LEVELS = (
      'State',
      'City',
      'City Council',
      'County',
      'County Council',
      'Judicial',
      'Mayor & City Council',
      'School District',
      'Special District (water, fire, transit, library)',
      'State House District',
      'State Senate District',
      'Town',
      'Township',
      'Village',
      'Ward',
      'Other'
    )

    ElectionLevel = apps.get_model('manager', 'ElectionLevel')
    for name in ELECTION_LEVELS:
        el = ElectionLevel(name=name)
        el.save()

def populate_election_type(apps, schema):
    ELECTION_TYPES = (
        ('Caucus',                            10),
        ('General',                           20),
        ('General Runoff',                    30),
        ('Primary',                           40),
        ('Primary Runoff',                    50),
        ('Runoff',                            60),
        ('Recall',                            70),
        ('Special',                           80),
        ('State Primary',                     90),
        ('Congressional Primary',             100),
        ('Presidential Primary',              110),
        ('Presidential and State Primary ',   120),
        ('Presidential and District Primary', 130),
        ('Democratic Presidential Primary',   140),
        ('Republican Presidential Primary',   150),
        ('Party Precinct Caucus',             160),
        ('Democratic Presidential Caucus',    170),
        ('Republican Presidential Caucus',    180),
        ('State General',                     190),
        ('Federal General',                   200),
        ('Midterm General',                   210),
        ('Gubernatorial Primary',             220),
        ('Gubernatorial',                     230),
        ('Supreme Court',                     240),
        ('Judicial',                          250),
    )

    ElectionType = apps.get_model('manager', 'ElectionType')
    for (name, priority) in ELECTION_TYPES:
        et = ElectionType(name=name, priority=priority)
        et.save()


def populate_election_date_type(apps, schema):
    # '%a %B %d, %Y',  # 'Mon March 31, 2016'
    # {date} - render date only, ignore time
    # {datetime} - render date/time with TZ
    # {time} - render only time with TZ
    ELECTION_DATE_TYPES = (
      ('by',              True,   '%a %B %d, %Y', '%I:%M%p %Z', '{datetime}'),  # default value should be first in the list
      ('change of party', False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime} last day to change party affiliation'),
      ('fax',             False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime} if by fax'),
      ('hand delivered',  False,  '%a %B %d, %Y', '%I:%M%p %Z', 'Hand delivered by {datetime}'),
      ('in person',       False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime} if requesting in person'),
      ('mail',            False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime} for ballout by mail'),
      ('online',          False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime} if online'),
      ('other',           False,  '%a %B %d, %Y', '%I:%M%p %Z', '{datetime}'),
      ('postmarked by',   False,  '%a %B %d, %Y', '%I:%M%p %Z', 'Postmarked by {datetime}'),
      ('received by',     False,  '%a %B %d, %Y', '%I:%M%p %Z', 'Received by {datetime}'),
      ('to be announced', False,  '', '', 'To Be Announced'),
      ('not required',    False,  '', '', 'Not Required'),
      ('automatic',       False,  '', '', 'Automatic'),
    )

    ElectionDateType = apps.get_model('manager', 'ElectionDateType')
    for (name, default, date_format, time_format, format) in ELECTION_DATE_TYPES:
        et = ElectionDateType(name=name, date_format=date_format, time_format=time_format, default=default, format=format)
        et.save()


def populate_election_url_type(apps, schema):
    ELECTION_URL_TYPES = (
      (1, 'Election Web Site', ),
      (2, 'Official Candidate List', ),
      (3, 'Sample Ballot Information', ),
    )

    URLType = apps.get_model('manager', 'URLType')
    for (uid, uname) in ELECTION_URL_TYPES:
      ut = URLType(id=uid, name=uname)
      ut.save()


def populate_contact_person_type(apps, schema):
    CONTACT_PERSON_TYPE = (
      (1, 'default', ),
    )

    ContactPersonType = apps.get_model('manager', 'ContactPersonType')
    for (cpt_id, cpt_name) in CONTACT_PERSON_TYPE:
      cpt = ContactPersonType(id=cpt_id, name=cpt_name)
      cpt.save()


def populate_address_type(apps, schema):
    ADDRESS_TYPE = (
      (1, 'default', ),
    )

    AddressType = apps.get_model('manager', 'AddressType')
    for (at_id, at_name) in ADDRESS_TYPE:
      at = AddressType(id=at_id, name=at_name)
      at.save()


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_election_level),
        migrations.RunPython(populate_election_type),
        migrations.RunPython(populate_election_date_type),
        migrations.RunPython(populate_election_url_type),
        migrations.RunPython(populate_contact_person_type),
        migrations.RunPython(populate_address_type),
    ]
