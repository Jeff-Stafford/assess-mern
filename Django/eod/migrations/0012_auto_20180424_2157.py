# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-04-24 21:57
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eod', '0011_auto_20180411_2242'),
    ]

    operations = [
        migrations.AlterField(
            model_name='officer',
            name='fax',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='officer',
            name='phone',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]