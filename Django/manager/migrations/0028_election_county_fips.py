# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-03-06 18:28
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0027_auto_20180306_1745'),
    ]

    operations = [
        migrations.AddField(
            model_name='election',
            name='county_fips',
            field=models.CharField(blank=True, max_length=36, null=True),
        ),
    ]