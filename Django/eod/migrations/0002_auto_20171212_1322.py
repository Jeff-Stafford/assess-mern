# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-12-12 13:22
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('eod', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='county',
            options={'managed': False, 'ordering': ['name']},
        ),
        migrations.AlterModelOptions(
            name='municipality',
            options={'managed': False, 'ordering': ['name']},
        ),
        migrations.AlterModelOptions(
            name='state',
            options={'managed': False, 'ordering': ['name']},
        ),
        migrations.AlterModelOptions(
            name='votingregion',
            options={'managed': False, 'ordering': ['name']},
        ),



        migrations.AlterModelOptions(
            name='address',
            options={},
        ),
        migrations.AlterModelOptions(
            name='county',
            options={},
        ),
        migrations.AlterModelOptions(
            name='localofficial',
            options={},
        ),
        migrations.AlterModelOptions(
            name='localofficialcorrection',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'ordering': ['-updated_at']},
        ),
        migrations.AlterModelOptions(
            name='localofficialcorrectionhistory',
            options={'default_permissions': ('add', 'change', 'delete', 'view'), 'ordering': ['-created_at']},
        ),
        migrations.AlterModelOptions(
            name='municipality',
            options={},
        ),
        migrations.AlterModelOptions(
            name='officer',
            options={},
        ),
        migrations.AlterModelOptions(
            name='state',
            options={},
        ),
        migrations.AlterModelOptions(
            name='votingregion',
            options={},
        ),
        migrations.AlterField(
            model_name='addressofficer',
            name='address',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='eod.Address'),
        ),
        migrations.AlterField(
            model_name='addressofficer',
            name='officer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='eod.Officer'),
        ),
    ]