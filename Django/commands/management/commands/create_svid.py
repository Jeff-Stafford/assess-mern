import sys
import os
import xlrd
import pprint

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import models
from django.db import transaction

from electiongis import models as gmodels
from svid import models as smodels
from .utils import slugify


class Command(BaseCommand):
    help = 'Create only SVID data (if not-exist)'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

        self.global_options = dict()
        self.voter_id = dict(
            states_by_index=dict(),
            states=dict(),
            stusps_to_state=dict(),
        )

    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-data',
            action='store_true',
            dest='drop-data',
            default=False,
            help='Drop all exists eligibility data for all states',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        drop_data = options['drop-data']

        if drop_data:
            print("Delete exists data")
            smodels.StateVoterInformation.objects.all().delete()

        for state in gmodels.State.objects.all():
            try:
                smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)
                print("WARNING: SVID already exists for state %s, ignore" % state.stusps)
            except smodels.StateVoterInformation.DoesNotExist:
                smodels.StateVoterInformation.objects.create(state_geoid=state.geoid)
