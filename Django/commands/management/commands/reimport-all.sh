#!/bin/bash
# re-import all

python3 manage.py create_svid --drop-data

python3 manage.py import_svid_domestic commands/management/commands/Eligibility-Domestic-3.0.xlsx
python3 manage.py import_svid_overseas_military commands/management/commands/Eligibility-Overseas-Military-3.0.xlsx

python3 manage.py import_voting_methods commands/management/commands/Voting-Methods-TransOptions-LookupTools-3.0.xlsx

python3 manage.py import_voter_id --category=registration commands/management/commands/Voter-ID-Registration-3.0.xlsx
python3 manage.py import_voter_id --category=in_person commands/management/commands/Voter-ID-In-Person-3.0.xlsx
python3 manage.py import_voter_id --category=overseas_military commands/management/commands/Voter-ID-Overseas-Military-3.0.xlsx
