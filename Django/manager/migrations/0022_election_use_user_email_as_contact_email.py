# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-09-29 23:26
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0021_election_use_default_elections_website'),
    ]

    operations = [
        migrations.AddField(
            model_name='election',
            name='use_user_email_as_contact_email',
            field=models.BooleanField(default=False),
        ),
    ]
