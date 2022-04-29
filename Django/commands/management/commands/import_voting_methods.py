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


class Command(BaseCommand):
    help = 'Import Voting Methods from excel file'

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('excel_file', nargs=1)

        # Named (optional) arguments
        parser.add_argument(
            '--drop-data',
            action='store_true',
            dest='drop-data',
            default=False,
            help='Drop all exists voting methods data for all states',
        )

    @transaction.atomic
    def handle(self, *args, **options):

        excel_file = options['excel_file'][0]
        drop_data = options['drop-data']
        print("Excel file: ", excel_file)
        # print("Drop data?", )

        xls_wb = xlrd.open_workbook(excel_file)


        methods = dict()
        options = dict()
        lookup = dict()
        for sheet in xls_wb.sheets():
            try:
                state = gmodels.State.objects.get(stusps=sheet.name)

                vm = dict()
                methods[state] = vm

                # voter methods
                for row_idx in range(2, 12):
                    name = sheet.cell(row_idx, 1).value
                    vm[sheet.cell(row_idx, 0).value] = dict(
                        id=sheet.cell(row_idx, 0).value,
                        name=name.strip() if name else "",
                        allowed=bool(sheet.cell(row_idx, 2).value),
                        additional_info=sheet.cell(row_idx, 3).value)

                # transmissions options
                to=dict(
                    domestic=dict(),
                    overseas=dict(),
                    military=dict()
                )
                options[state] = to

                for k, rng in (('domestic', (16,22,)), ('overseas', (28,34,)), ('military', (41, 47,))):

                    if k == 'military' and bool(sheet.cell(rng[0]-2, 2).value):
                        # use overseas
                        to[k] = to['overseas']
                        # print("Use military", state)
                        continue


                    to[k]['methods'] = dict()

                    for row_idx in range(*rng):
                        id = sheet.cell(row_idx, 0).value
                        name = sheet.cell(row_idx, 1).value.strip() # "|".join().strip(" \r\n"),
                        # print("name='%s'" % name)
                        to[k]['methods'][id] = dict(
                            id=id,
                            name=name.strip() if name else "",
                            options=dict()
                        )

                        opts = to[k]['methods'][id]['options']
                        for col_idx in range(2, 11, 2):
                            # print("===", sheet.cell(15, col_idx).value)
                            info = sheet.cell(row_idx, col_idx+1).value
                            opts[sheet.cell(15, col_idx).value] = dict(
                                kind=sheet.cell(row_idx-1, col_idx).value,
                                allowed=bool(sheet.cell(row_idx, col_idx).value),
                                additional_info=info.strip() if info else "",
                            )

                        to[k]['notes'] = sheet.cell(rng[1]+1,2).value

                # lookup methods
                lt = dict()
                lookup[state] = lt
                for row_idx in range(55, 61):
                    url = sheet.cell(row_idx,2).value
                    id = sheet.cell(row_idx,0).value
                    lookup[state][id] = url.strip() if url else ""


            except gmodels.State.DoesNotExist:
                pass

        # pp = pprint.PrettyPrinter(indent=4, width=200)
        # pp.pprint(lookup['AK'])

        # cleanup
        if drop_data:
            print("Delete exists data")
            smodels.StateDocumentTransmissionMethod.objects.all().delete()
            smodels.StateDocumentTransmission.objects.all().delete()
            smodels.StateVotingMethod.objects.all().delete()
            smodels.StateLookupTool.objects.all().delete()

        for state, methods in methods.items():
            svi = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)
            for kind, method in methods.items():
                mt = smodels.VotingMethodType.objects.get(kind=kind)
                smodels.StateVotingMethod.objects.create(state_voter_info=svi,
                    voting_method_type=mt,
                    allowed=method['allowed'],
                    additional_info=method['additional_info'],
                    additional_info_type='M')

        for state, options in options.items():
            svi = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)
            for kind, trans in options.items():
                vt = smodels.VoterType.objects.get(name__icontains=kind)
                sdt = smodels.StateDocumentTransmission.objects.create(state_voter_info=svi,
                    voter_type=vt, additional_info=trans['notes'])

                # print("trans", trans)

                for name, opt in trans['methods'].items():
                    doc_type = smodels.DocumentType.objects.get(kind=name)

                    for id, dtm in opt['options'].items():
                        doc_trans_method = smodels.DocumentTransmissionMethod.objects.get(name=id)
                        smodels.StateDocumentTransmissionMethod.objects.create(state_doc_transmission=sdt,
                            document_type=doc_type,
                            document_transmission_method=doc_trans_method,
                            allowed=dtm['allowed'],
                            additional_info=dtm['additional_info'],
                            additional_info_type='M')

        for state, tools in lookup.items():
            svi = smodels.StateVoterInformation.objects.get(state_geoid=state.geoid)

            for kind, url in tools.items():
                lt = smodels.LookupTool.objects.get(kind=kind)
                smodels.StateLookupTool.objects.create(state_voter_info=svi,
                    lookup_tool=lt, url=url)

