# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-08-24 07:14
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0013_election_request_email_was_sent'),
    ]

    operations = [
        migrations.AddField(
            model_name='election',
            name='request_email_was_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
