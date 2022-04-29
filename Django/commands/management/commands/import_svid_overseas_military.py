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
    help = 'Import Eligibity data(overseas & military) from excel file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

        self.eligibility_requirement_list = dict()

        self.eligibility = dict()

        o = self.voter_type_by_name('overseas')
        self.eligibility[o] = dict(
            states_by_index=dict(),
            states=dict(),
            stusps_to_state=dict(),
        )
        m = self.voter_type_by_name('military')
        self.eligibility[m] = dict(
            states_by_index=dict(),
            states=dict(),
            stusps_to_state=dict(),
        )

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('excel_file', nargs=1)

        # Named (optional) arguments
        parser.add_argument(
            '--drop-data',
            action='store_true',
            dest='drop-data',
            default=False,
            help='Drop all exists eligibility data for all states',
        )


    def voter_type_by_name(self, name):
        if name.startswith("overseas"):
            return smodels.VoterType.objects.get(kind="O")
        elif name.startswith("military"):
            return smodels.VoterType.objects.get(kind="M")

        print("Unknow voter type: ", sheet.name, " expected overseas or military")
        sys.exit()

    def handle_sheet(self, sheet):
        voter_type = self.voter_type_by_name(sheet.name)

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
                if not stusps in self.eligibility[voter_type]['states']:
                    self.eligibility[voter_type]['states'][stusps] = list()
                    self.eligibility[voter_type]['states_by_index'][last_col_idx] = stusps
                    self.eligibility[voter_type]['stusps_to_state'][stusps] = state

            except:
                break
        # print("last_col_idx=", last_col_idx)

        for state_col in range(1, last_col_idx):
            # print("state_col=", state_col)

            stusps = self.eligibility[voter_type]['states_by_index'][state_col]

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
                        id = slugify(text) # ("eligibility_%s_requirements" % sheet.name).lower()
                        self.eligibility_requirement_list[id] = text
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

                self.eligibility[voter_type]['states'][stusps].append(state)


    def drop_data(self):
        print("Delete exists data")
        smodels.EligibilityRequirementList.objects.all().delete()
        smodels.EligibilityRequirementItem.objects.all().delete()
        smodels.EligibilityRequirement.objects.all().delete()


    def create_eligibility_requirement_list(self):
        self.identification_requirement_list = dict()
        for kind, name in self.eligibility_requirement_list.items():
            item = smodels.EligibilityRequirementList.objects.create(kind=kind, name=name.replace("{state_name}", "state"), name_format=name)
            self.eligibility_requirement_list[kind] = item


    def create_eligibility(self):
        print("Import Eligibility data")

        for voter_type, eblock in self.eligibility.items():
            # print("voter_type", voter_type, eblock)
            for stusps, blocks in eblock['states'].items():
                pos = 0
                for block in blocks:
                    state = eblock['stusps_to_state'][stusps]
                    state_voter_info = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)

                    header = "\n".join(block['header']).strip(" \n").replace("{state_name}", state.name)
                    footer = "\n".join(block['footer']).strip(" \n").replace("{state_name}", state.name)

                    er = smodels.EligibilityRequirement.objects.create(position=pos, state_voter_info=state_voter_info,
                        header=header, header_type='M',
                        footer=footer, footer_type='M',
                        voter_type=voter_type)
                    pos += 1

                    for kind, name in block['options'].items():
                        item = self.eligibility_requirement_list[kind]
                        smodels.EligibilityRequirementItem.objects.create(eligibility_requirement=er, item=item)


    @transaction.atomic
    def handle(self, *args, **options):

        excel_file = options['excel_file'][0]
        drop_data = options['drop-data']

        print("Excel file: ", excel_file)
        # print("Drop data?", )

        xls_wb = xlrd.open_workbook(excel_file)
        for sheet in range(0, 3):
            xls_sheet = xls_wb.sheet_by_index(sheet)
            self.handle_sheet(xls_sheet)

        pp = pprint.PrettyPrinter(indent=4, width=200)
        # pp.pprint(self.eligibility_requirement_list)

        if drop_data:
            self.drop_data()
        self.create_eligibility_requirement_list()
        self.create_eligibility()



