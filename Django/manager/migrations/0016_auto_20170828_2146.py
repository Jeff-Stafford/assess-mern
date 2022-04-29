# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-08-28 21:46
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manager', '0015_electionresultdownloadhistory'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='electionresultdownloadhistory',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'verbose_name': 'Election Results Download History', 'verbose_name_plural': 'Election Results Download History'},
        ),
        migrations.AddField(
            model_name='electionresultdownloadhistory',
            name='error',
            field=models.CharField(blank=True, max_length=1024, null=True),
        ),
        migrations.AddField(
            model_name='electionresultdownloadhistory',
            name='status',
            field=models.CharField(choices=[('PENDING', 'PENDING'), ('PROCESSING', 'PROCESSING'), ('READY', 'READY'), ('ERROR', 'ERROR')], default='PENDING', max_length=10),
        ),
    ]