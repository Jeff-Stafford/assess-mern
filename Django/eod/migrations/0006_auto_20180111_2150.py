# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-01-11 21:50
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eod', '0005_auto_20180110_2112'),
    ]

    operations = [
        migrations.AlterField(
            model_name='address',
            name='website',
            field=models.URLField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='localofficial',
            name='website',
            field=models.URLField(blank=True, max_length=255),
        ),
    ]