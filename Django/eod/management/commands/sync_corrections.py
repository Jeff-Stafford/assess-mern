import sys
import os

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db import models
from django.core.management.base import BaseCommand
from eod.models import LocalOfficial, SchedulerSettings, LocalOfficialCorrection, CorrectionStatus, SchedulerStatus

import logging
logger = logging.getLogger(__name__)


class Command(BaseCommand):

    def handle(self, *args, **options):
        """
        Synchronize LEO settings (Correction and Scheduler)
        """
        logger.warning("Synchronize LEO settings")
        total_leos = 0
        correction_created_total = 0
        settings_total = 0
        settings_created_total = 0

        corrections = LocalOfficialCorrection.objects.all().values_list('local_official_id', flat=True)
        for cid in LocalOfficial.objects.filter(~Q(id__in=corrections)).values_list('id', flat=True):
            leo_correction = LocalOfficialCorrection.objects.create(
                local_official_id=cid,
                status=CorrectionStatus.INITIAL)
            leo_correction.save()
            correction_created_total += 1

        settings = SchedulerSettings.objects.all().values_list('local_official_id', flat=True)
        for sid in LocalOfficial.objects.filter(~Q(id__in=settings)).values_list('id', flat=True):
            scheduler_settings = SchedulerSettings.objects.create(local_official_id=sid, status=SchedulerStatus.MANUAL)
            scheduler_settings.save()
            settings_created_total += 1

        logger.warning("Total Corrections synced: %s", correction_created_total)
        logger.warning("Total Scheduler settings synced: %s", settings_created_total)