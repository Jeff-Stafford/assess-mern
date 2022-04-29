# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-08-28 19:26
from __future__ import unicode_literals

from django.conf import settings
import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import manager.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('manager', '0014_election_request_email_was_sent_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='ElectionResultDownloadHistory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('download_at', models.DateTimeField(blank=True, null=True)),
                ('elections_ids', django.contrib.postgres.fields.jsonb.JSONField(default=list)),
                ('elections_archive_file', models.FileField(blank=True, null=True, upload_to=manager.models.archive_path)),
                ('download_by_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='+', to=settings.AUTH_USER_MODEL)),
                ('election_result_attachment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='download_history', to='manager.ElectionResultAttachment')),
            ],
            options={
                'db_table': 'election_result_download_history',
                'default_permissions': ('add', 'change', 'delete', 'view'),
            },
        ),
    ]