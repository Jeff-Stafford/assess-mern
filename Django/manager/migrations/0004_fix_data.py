# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

def fix_election_date_types(apps, schema):
    # rename 'by' to 'blank...'
    ElectionDateType = apps.get_model('manager', 'ElectionDateType')
    edt = ElectionDateType.objects.get(name='by')
    edt.name = 'blank (no label)'
    edt.save()

    # rename 'received by' to 'post received by...'
    edt = ElectionDateType.objects.get(name='received by')
    edt.name = 'post received by'
    edt.format = 'Post received by {datetime}'
    edt.save()

    # add 'email'
    # '%a %B %d, %Y',  # 'Mon March 31, 2016'
    # {date} - render date only, ignore time
    # {datetime} - render date/time with TZ
    # {time} - render only time with TZ
    ELECTION_DATE_TYPES = (
      ('email', False, '%a %B %d, %Y', '%I:%M%p %Z', '{date} for ballout by e-mail'),
    )

    ElectionDateType = apps.get_model('manager', 'ElectionDateType')
    for (name, default, date_format, time_format, format) in ELECTION_DATE_TYPES:
        et = ElectionDateType(name=name, date_format=date_format, time_format=time_format, default=default, format=format)
        et.save()


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0003_auto_20160601_1636'),
    ]

    operations = [
        migrations.RunPython(fix_election_date_types),
    ]
