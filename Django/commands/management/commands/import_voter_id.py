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
    help = 'Import Voter Id data from excel file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

        self.global_options = dict()
        self.voter_id = dict(
            states_by_index=dict(),
            states=dict(),
            stusps_to_state=dict(),
        )

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('excel_file', nargs=1)

        parser.add_argument(
            '--category',
            action='store',
            dest='category',
            default="",
            help='Voter Id category: in_person, registration, overseas_military',
        )

        # Named (optional) arguments
        parser.add_argument(
            '--drop-data',
            action='store_true',
            dest='drop-data',
            default=False,
            help='Drop all exists voter id data for all states',
        )


    def handle_sheet(self, category, sheet):
        HEADER = "intro text"
        OPTIONS = "list of options"
        FOOTER = "closing statement"

        header_row = None
        options_row = None
        footer_row = None

        # print("=== ", category, sheet.name)

        # collect req items
        for row_idx in range(0, sheet.nrows):    # Iterate through rows
            cell = sheet.cell(row_idx, 0)
            text = cell.value.lower().strip().replace("\xa0", " ") if cell.value else ""

            # try:
            #     print(row_idx, text)
            # except:
            #     print(row_idx, "***unicode***")

            if HEADER in text:
                header_row = row_idx
            elif OPTIONS in text:
                header_row = (header_row, row_idx,)
                options_row = row_idx
            elif FOOTER in text:
                options_row = (options_row, row_idx,)
                footer_row = (row_idx, sheet.nrows,)
                break

        # print(header_row, options_row, footer_row)

        for last_col_idx in range(1, 100):
            try:
                stusps=sheet.cell(header_row[0], last_col_idx).value
                state = gmodels.State.objects.get(stusps=stusps)
                #print(stusps)
                if not stusps in self.voter_id['states']:
                    self.voter_id['states'][stusps] = list()
                    self.voter_id['states_by_index'][last_col_idx] = stusps
                    self.voter_id['stusps_to_state'][stusps] = state

            except:
                break
        # print("last_col_idx=", last_col_idx)

        for state_col in range(1, last_col_idx):
            # print("state_col=", state_col)

            stusps = self.voter_id['states_by_index'][state_col]

            state = dict(header=list(), options=dict(), footer=list())
            state_headers = 0
            state_options = 0
            state_footers = 0

            for row in range(header_row[0], footer_row[1]):  # +1 skip header itself
                cell = sheet.cell(row, 0)
                text = cell.value.strip().replace("\xa0", " ") if cell.value else ""
                if not text:
                    continue
                text = text.replace("<state_name>", "{state_name}")

                allowed = sheet.cell(row, state_col).value
                allowed = allowed.strip() if allowed else ""

                # try:
                #     print("%d: '%s', '%s'" % (row, text, allowed))
                # except:
                #     print("%d: '%s'" % (row, "*** unicode ***"))

                if header_row[0]+1 <= row < header_row[1]:
                    if allowed:
                        #print("Register header: ", text)
                        state['header'].append(text)
                        state_headers += 1

                elif options_row[0]+1 <= row < options_row[1]:
                    if allowed:
                        id = slugify(text)
                        self.global_options[id] = text
                        state['options'][id] = dict(allowed=True, text=text)
                        state_options += 1

                elif footer_row[0]+1 <= row < footer_row[1]:
                    if allowed:
                        #print("Register footer: ", text)
                        state['footer'].append(text)
                        state_footers += 1


            if state_headers or state_options or state_footers:

                # print("================", stusps)
                #
                # pp = pprint.PrettyPrinter(indent=4, width=200)
                # pp.pprint(state)

                self.voter_id['states'][stusps].append(state)


    def drop_data(self):
        print("Delete exists data")
        smodels.IdentificationRequirementList.objects.all().delete()
        smodels.IdentificationRequirementItem.objects.all().delete()
        smodels.IdentificationRequirement.objects.all().delete()


    def create_identification_requirement_list(self):
        self.identification_requirement_list = dict()
        for kind, name in self.global_options.items():
            item = smodels.IdentificationRequirementList.objects.create(kind=kind, name=name.replace("{state_name}", "state"), name_format=name)
            self.identification_requirement_list[kind] = item


    def create_voter_id(self, category):
        print("Import Voter Id data for %s category" % category)

        cats = None
        if category == 'registration':
            cats = (smodels.Category.objects.get(kind='voter_registration'),)
        elif category == 'in_person':
            cats = (smodels.Category.objects.get(kind='voting_in_person'),)
        elif category == 'overseas_military':
            cats = (smodels.Category.objects.get(kind='voting_overseas'), smodels.Category.objects.get(kind='voting_military'),)

        # print(cats)

        for category in cats:

            for stusps, blocks in self.voter_id['states'].items():
                pos = 0
                for block in blocks:
                    state = self.voter_id['stusps_to_state'][stusps]
                    state_voter_info = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)

                    header = "\n".join(block['header']).strip(" \n").replace("{state_name}", state.name)
                    footer = "\n".join(block['footer']).strip(" \n").replace("{state_name}", state.name)

                    ir = smodels.IdentificationRequirement.objects.create(position=pos, state_voter_info=state_voter_info,
                        header=header, header_type='M',
                        footer=footer, footer_type='M',
                        category=category)
                    pos += 1

                    for kind, name in block['options'].items():
                        item = self.identification_requirement_list[kind]
                        smodels.IdentificationRequirementItem.objects.create(identification_requirement=ir, item=item)


    @transaction.atomic
    def handle(self, *args, **options):

        excel_file = options['excel_file'][0]
        drop_data = options['drop-data']
        category = options['category']

        print("Excel file: ", excel_file)
        # print("Drop data?", )

        sheets_range = None
        if category == 'in_person':
            sheets_range = (0, 2)
        elif category == 'registration':
            sheets_range = (0, 5)
        elif category == 'overseas_military':
            sheets_range = (0, 1)

        if sheets_range is None:
            return

        xls_wb = xlrd.open_workbook(excel_file)
        for sheet in range(*sheets_range):
            xls_sheet = xls_wb.sheet_by_index(sheet)
            self.handle_sheet(category, xls_sheet)

        pp = pprint.PrettyPrinter(indent=4, width=200)
        # pp.pprint(self.global_options)

        if drop_data:
            self.drop_data()
        self.create_identification_requirement_list()
        self.create_voter_id(category)



