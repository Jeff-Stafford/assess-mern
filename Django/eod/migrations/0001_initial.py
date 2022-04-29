# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-10-10 23:46
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import django_fsm
import eod.json
import phonenumber_field.modelfields
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.IntegerField(default=0)),
                ('address_to', models.CharField(blank=True, max_length=255)),
                ('street1', models.CharField(blank=True, max_length=255)),
                ('street2', models.CharField(blank=True, max_length=255)),
                ('city', models.CharField(blank=True, max_length=255)),
                ('state', models.CharField(blank=True, max_length=3)),
                ('zip', models.CharField(blank=True, max_length=6)),
                ('zip4', models.CharField(blank=True, max_length=5)),
                ('website', models.URLField(blank=True, max_length=255)),
                ('email', models.EmailField(blank=True, max_length=255)),
                ('is_physical', models.BooleanField(blank=False)),
                ('is_regular_mail', models.BooleanField(blank=False)),
                ('functions', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=50), blank=True, default=[], size=None)),
            ],
            options={
                'db_table': 'addresses',
                'managed': True,            },
        ),
        migrations.CreateModel(
            name='County',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('county_type', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'counties',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='LocalOfficial',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('updated', models.DateTimeField()),
                ('general_email', models.EmailField(blank=True, max_length=255)),
                ('website', models.URLField(blank=True, max_length=255)),
                ('hours', models.CharField(blank=True, max_length=255)),
                ('further_instruction', models.TextField(blank=True)),
                ('status', models.IntegerField(blank=True, null=True)),
            ],
            options={
                'db_table': 'local_officials',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='LocalOfficialCorrection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', django_fsm.FSMField(choices=[('CORRECTION_ACCEPTED', 'CORRECTION_ACCEPTED'), ('CORRECTION_FOLLOWUP_SENT', 'CORRECTION_FOLLOWUP_SENT'), ('CORRECTION_REJECTED', 'CORRECTION_REJECTED'), ('CORRECTION_SUBMITTED_NO_UPDATES', 'CORRECTION_SUBMITTED_NO_UPDATES'), ('CORRECTION_SUBMITTED_UPDATES', 'CORRECTION_SUBMITTED_UPDATES'), ('EMAIL_EXPIRED', 'EMAIL_EXPIRED'), ('EMAIL_FOLLOWUP_SCHEDULED', 'EMAIL_FOLLOWUP_SCHEDULED'), ('EMAIL_FOLLOWUP_SENT', 'EMAIL_FOLLOWUP_SENT'), ('EMAIL_NO_RESPONSE', 'EMAIL_NO_RESPONSE'), ('EMAIL_REJECTED_BOUNCE', 'EMAIL_REJECTED_BOUNCE'), ('EMAIL_REJECTED_COMPLAINT', 'EMAIL_REJECTED_COMPLAINT'), ('EMAIL_SCHEDULED', 'EMAIL_SCHEDULED'), ('EMAIL_SENT', 'EMAIL_SENT'), ('ERROR', 'ERROR'), ('INITIAL', 'INITIAL')], default='INITIAL', max_length=50)),
                ('status_context', django.contrib.postgres.fields.jsonb.JSONField(default=dict, encoder=eod.json.JSONEncoder)),
                ('user', models.IntegerField(blank=True, null=True)),
                ('is_system', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'correction',
                'managed': True,
                'ordering': ['-updated_at'],
                'default_permissions': ('add', 'change', 'delete', 'view'),
            },
        ),
        migrations.CreateModel(
            name='LocalOfficialCorrectionHistory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('status', django_fsm.FSMField(default='INITIAL', max_length=50)),
                ('status_context', django.contrib.postgres.fields.jsonb.JSONField(default=dict, encoder=eod.json.JSONEncoder)),
                ('user', models.IntegerField(blank=True, null=True)),
                ('is_system', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'correction_history',
                'managed': True,
                'ordering': ['-created_at'],
                'default_permissions': ('add', 'change', 'delete', 'view'),
            },
        ),
        migrations.CreateModel(
            name='Municipality',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('municipality_type', models.CharField(max_length=255)),
                ('county', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='municipalities', to='eod.County')),
            ],
            options={
                'db_table': 'municipalities',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Officer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.IntegerField(default=0)),
                ('office_name', models.CharField(blank=True, max_length=255)),
                ('title', models.CharField(blank=True, max_length=255)),
                ('suffix', models.CharField(blank=True, max_length=255)),
                ('first_name', models.CharField(blank=True, max_length=255)),
                ('initial', models.CharField(blank=True, max_length=255)),
                ('last_name', models.CharField(blank=True, max_length=255)),
                ('phone', phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=255)),
                ('fax', phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=255)),
                ('email', models.EmailField(blank=True, max_length=255)),
           ],
            options={
                'db_table': 'officers',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='State',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('abbr', models.CharField(max_length=3)),
            ],
            options={
                'db_table': 'states',
                'managed': False
            },
        ),
        migrations.CreateModel(
            name='VotingRegion',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('county', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='regions', to='eod.County')),
                ('municipality', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='regions', to='eod.Municipality')),
                ('state', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='regions', to='eod.State')),
            ],
            options={
                'db_table': 'voting_regions',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='SchedulerSettings',
            fields=[
                ('local_official', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to='eod.LocalOfficial')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', django_fsm.FSMIntegerField(default=1)),
                ('status_message', models.CharField(max_length=256)),
                ('cron_settings', django.contrib.postgres.fields.jsonb.JSONField(default=dict, encoder=eod.json.JSONEncoder)),
            ],
        ),
        migrations.CreateModel(
            name='AddressOfficer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('address', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                              related_name='contacts', to='eod.Address')),
                ('officer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                              related_name='contact_addresses', to='eod.Officer')),
            ],
            options={
                'db_table': 'address_officer',
                'managed': True,
            },
        ),
        migrations.AddField(
            model_name='address',
            name='local_official',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='addresses',
                                    to='eod.LocalOfficial', blank=True, null=True),
        ),
        migrations.AddField(
            model_name='address',
            name='primary_contact',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='primary_contact_addresses', to='eod.Officer', blank=True, null=True),
       ),
       migrations.AddField(
            model_name='address',
            name='officers',
            field=models.ManyToManyField(through='eod.AddressOfficer', to='eod.Officer'),
        ),
        migrations.AddField(
            model_name='county',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='counties',
                                    to='eod.State'),
        ),
        migrations.AddField(
            model_name='localofficial',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='address', to='eod.VotingRegion'),
        ),
        migrations.AddField(
            model_name='localofficialcorrectionhistory',
            name='local_official',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='correction_history', to='eod.LocalOfficial'),
        ),
        migrations.AddField(
            model_name='localofficialcorrectionhistory',
            name='local_official_correction',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='correction_history', to='eod.LocalOfficialCorrection'),
        ),
        migrations.AddField(
            model_name='localofficialcorrection',
            name='local_official',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='corrections', to='eod.LocalOfficial'),
        ),
        migrations.AddField(
            model_name='municipality',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='municipalities', to='eod.State'),
        ),
        migrations.AddField(
            model_name='officer',
            name='addresses',
            field=models.ManyToManyField(through='eod.AddressOfficer', to='eod.Officer'),
        ),
        migrations.AddField(
            model_name='officer',
            name='local_official',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='officer', to='eod.LocalOfficial'),
       ),
     ]
