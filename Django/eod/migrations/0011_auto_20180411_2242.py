# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-04-11 22:42
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('eod', '0010_localofficial_geoid'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='localofficial',
            options={'ordering': ['region__name']},
        ),
    ]
