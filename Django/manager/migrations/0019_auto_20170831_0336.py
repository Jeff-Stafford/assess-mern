# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-08-31 03:36
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0018_auto_20170830_1823'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='election',
            options={'default_permissions': ('add', 'change', 'delete', 'view', 'view_all', 'send_request'), 'ordering': ['election_date']},
        ),
    ]