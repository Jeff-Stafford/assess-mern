# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-03-07 17:39
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0028_election_county_fips'),
    ]

    operations = [
        migrations.AlterField(
            model_name='location',
            name='location_type',
            field=models.CharField(choices=[('U', 'Unknown'), ('S', 'State'), ('C', 'County'), ('PL', 'Place'), ('DI', 'District')], db_index=True, default='U', max_length=2),
        ),
    ]