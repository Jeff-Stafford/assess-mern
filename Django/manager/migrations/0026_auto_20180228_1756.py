# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2018-02-28 17:56
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0025_auto_20180227_2341'),
    ]

    operations = [
        migrations.AlterField(
            model_name='election',
            name='election_type_detail',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='manager.ElectionTypeDetail'),
        ),
    ]
