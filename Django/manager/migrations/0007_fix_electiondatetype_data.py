# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

def fix_election_date_types(apps, schema):

    # rename back 'post received by' to 'received by'
    ElectionDateType = apps.get_model('manager', 'ElectionDateType')
    edt = ElectionDateType.objects.get(name='post received by')
    edt.name = 'received by'
    edt.format = 'Received by {datetime}'
    edt.save()

    # add 'post received by' between 'postmarked by' & 'received by'
    edt = ElectionDateType(name='post received by', date_format='%a %B %d, %Y', time_format='%I:%M%p %Z', default=False, format='Post received by {datetime}', position=105)
    edt.save()


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0006_electionlevel_position'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='electionlevel',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'ordering': ['position']},
        ),
        migrations.RunPython(fix_election_date_types),
        migrations.AlterModelOptions(
            name='urltype',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'ordering': ['name'], 'verbose_name': 'URL Type', 'verbose_name_plural': 'URL Types'},
        ),
    ]
