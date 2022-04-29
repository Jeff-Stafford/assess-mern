import sys
import os
import xlrd

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import models
from django.db import transaction

from electiongis import models as gmodels
from svid import models as smodels


class Command(BaseCommand):
    help = 'Import Eligibity data(domestic) from excel file'

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

    @transaction.atomic
    def handle(self, *args, **options):
        excel_file = options['excel_file'][0]
        drop_data = options['drop-data']
        print("Excel file: ", excel_file)

        xls_wb = xlrd.open_workbook(excel_file)
        xls_sheet = xls_wb.sheet_by_index(0)

        POSITIVE_REQ = "a) Positive Requirements"
        NEGATIVE_REQ = "b) Negative Requirements"
        RESTORATIVE_REQ = "c) Restorative Requirements"
        PRE_REGISTRATION = "d) Pre-registration"

        positive_req_row = None
        negative_req_row = None
        restorative_req_row = None
        pre_registration_row = None

        # collect req items
        for row_idx in range(0, xls_sheet.nrows):    # Iterate through rows
            cell = xls_sheet.cell(row_idx, 0).value
            if cell == POSITIVE_REQ:
                positive_req_row = row_idx
            elif cell == NEGATIVE_REQ:
                negative_req_row = row_idx
            elif cell == RESTORATIVE_REQ:
                restorative_req_row = row_idx
            elif cell == PRE_REGISTRATION:
                pre_registration_row = row_idx


        if positive_req_row is None:
            print("ERROR: Cannot find '%s' block" % POSITIVE_REQ)

        if negative_req_row is None:
            print("ERROR: Cannot find '%s' block" % NEGATIVE_REQ)

        if restorative_req_row is None:
            print("ERROR: Cannot find '%s' block" % RESTORATIVE_REQ)

        if pre_registration_row is None:
            print("ERROR: Cannot find '%s' block" % PRE_REGISTRATION)

        if positive_req_row is None or negative_req_row is None or restorative_req_row is None or pre_registration_row is None:
            return

        positive_block=dict(header='', items=[])
        negative_block=dict(header='', items=[])
        restorative_block=dict(header='', items=[])
        pre_registration_block=dict(header='', items=[])

        def handle_block(start, end, header=''):
            block=dict(header=header, items={}, row_to_item={})

            for row_idx in range(start, end):
                cell_name = xls_sheet.cell(row_idx, 0).value
                cell_key = xls_sheet.cell(row_idx, 1).value
                # print('|%s|%s|' % (cell_name, cell_key))
                if not cell_name and not cell_key:
                    break

                cell_name = cell_name.strip().replace("<state_name>", "{state_name}")

                if cell_key:
                    cell_key = cell_key.strip()
                    block['items'][cell_key] = cell_name
                    block['row_to_item'][row_idx] = cell_key
                else:
                    block['header'] = cell_name


            return block

        positive_block = handle_block(positive_req_row+1, negative_req_row)
        negative_block = handle_block(negative_req_row+1, restorative_req_row)
        restorative_block = handle_block(restorative_req_row+1, pre_registration_row, 'Restorative Requirements')
        pre_registration_block = handle_block(pre_registration_row+1, xls_sheet.nrows, 'Pre-registration')

        # print(positive_block)
        # print(negative_block)
        # print(pre_registration_block)

        # collect requirements per state
        def collect_requirements(block, col_idx):
            opts = []
            for row in block['row_to_item'].keys():
                opt = xls_sheet.cell(row, col_idx).value
                if opt:
                    opts.append(block['row_to_item'][row])

            return opts

        FIRST_STATE_COL = 2
        states = []
        for col_idx in range(FIRST_STATE_COL, xls_sheet.ncols):
            state_cell = xls_sheet.cell(0, col_idx).value
            if not state_cell:
                break
            state = gmodels.State.objects.filter(stusps=state_cell).get()
            pos = collect_requirements(positive_block, col_idx)
            neg = collect_requirements(negative_block, col_idx)
            res = collect_requirements(restorative_block, col_idx)
            pre = collect_requirements(pre_registration_block, col_idx)

            st = dict(state=state, pos=pos, neg=neg, res=res, pre_reg=pre)
            # if state.stusps == 'CT':
            #     print(st)
            states.append(st)

        # cleanup
        if drop_data:
            print("Delete exists data")
            smodels.EligibilityRequirementList.objects.all().delete()
            smodels.EligibilityRequirementItem.objects.all().delete()
            smodels.EligibilityRequirement.objects.all().delete()

        def create_eligibility_requirement_list(block):
            block['db_items'] = dict()
            for kind, name in block['items'].items():
                item = smodels.EligibilityRequirementList.objects.create(kind=kind, name=name.replace("{state_name}", "state"), name_format=name)
                block['db_items'][kind] = item

        create_eligibility_requirement_list(positive_block)
        create_eligibility_requirement_list(negative_block)
        create_eligibility_requirement_list(restorative_block)
        create_eligibility_requirement_list(pre_registration_block)

        def create_eligibility_requirement(state, state_voter_info):
            voter_type = smodels.VoterType.objects.get(kind='D')

            for pos, blocks in enumerate([(positive_block, state['pos'],), (negative_block, state['neg'],), (restorative_block, state['res'],), (pre_registration_block, state['pre_reg'],)]):
                gblock, items = blocks
                if not items:
                    continue

                header = gblock['header']
                if header:
                    header = header.replace("{state_name}", state['state'].name).strip()

                er = smodels.EligibilityRequirement.objects.create(position=pos, state_voter_info=state_voter_info, header=header, header_type='M', voter_type=voter_type)
                for kind in items:
                    smodels.EligibilityRequirementItem.objects.create(eligibility_requirement=er, item=gblock['db_items'][kind])


        for s in states:
            state = s['state']
            svi = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)
            create_eligibility_requirement(s, svi)
