# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-06-01 16:40
from __future__ import unicode_literals

from django.db import migrations, models


def fix_election_date_types_positions(apps, schema):
    ELECTION_DATE_TYPES = (
      ('blank (no label)',  10),
      ('change of party',   20),
      ('fax',               30),
      ('hand delivered',    40),
      ('in person',         50),
      ('mail',              60),
      ('email',             70),
      ('online',            80),
      ('other',             90),
      ('postmarked by',     100),
      ('post received by',  110),
      ('to be announced',   120),
      ('not required',      130),
      ('automatic',         140),
    )

    ElectionDateType = apps.get_model('manager', 'ElectionDateType')
    for (name, position) in ELECTION_DATE_TYPES:
        et = ElectionDateType.objects.get(name=name)
        et.position = position
        et.save()

class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0004_fix_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='electiondatetype',
            name='position',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='electiondatetype',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'ordering': ['position']},
        ),
        migrations.RunPython(fix_election_date_types_positions),
    ]
