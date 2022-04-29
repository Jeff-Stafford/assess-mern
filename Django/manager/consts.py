# Election Date Formats
INPUT_DATE_FORMATS = [
    '%Y-%m-%d',      # '2006-10-25'
    '%m/%d/%Y',      # '10/25/2006'
    '%m/%d/%y',      # '10/25/06',
    '%a %B %d, %Y',  # 'Mon March 31, 2016'
    '%B %d, %Y',  # 'March 31, 2016'
]

#
STATES = (
    ('', '', 'State'),
    ('1', 'AL', 'Alabama'),
    ('2', 'AK', 'Alaska'),
    ('4', 'AZ', 'Arizona'),
    ('5', 'AR', 'Arkansas'),
    ('6', 'CA', 'California'),
    ('8', 'CO', 'Colorado'),
    ('9', 'CT', 'Connecticut'),
    ('10', 'DE', 'Delaware'),
    ('11', 'DC', 'District of Columbia'),
    ('12', 'FL', 'Florida'),
    ('13', 'GA', 'Georgia'),
    ('15', 'HI', 'Hawaii'),
    ('16', 'ID', 'Idaho'),
    ('17', 'IL', 'Illinois'),
    ('18', 'IN', 'Indiana'),
    ('19', 'IA', 'Iowa'),
    ('20', 'KS', 'Kansas'),
    ('21', 'KY', 'Kentucky'),
    ('22', 'LA', 'Louisiana'),
    ('23', 'ME', 'Maine'),
    ('24', 'MD', 'Maryland'),
    ('25', 'MA', 'Massachusetts'),
    ('26', 'MI', 'Michigan'),
    ('27', 'MN', 'Minnesota'),
    ('28', 'MS', 'Mississippi'),
    ('29', 'MO', 'Missouri'),
    ('30', 'MT', 'Montana'),
    ('31', 'NE', 'Nebraska'),
    ('32', 'NV', 'Nevada'),
    ('33', 'NH', 'New Hampshire'),
    ('34', 'NJ', 'New Jersey'),
    ('35', 'NM', 'New Mexico'),
    ('36', 'NY', 'New York'),
    ('37', 'NC', 'North Carolina'),
    ('38', 'ND', 'North Dakota'),
    ('39', 'OH', 'Ohio'),
    ('40', 'OK', 'Oklahoma'),
    ('41', 'OR', 'Oregon'),
    ('42', 'PA', 'Pennsylvania'),
    ('44', 'RI', 'Rhode Island'),
    ('45', 'SC', 'South Carolina'),
    ('46', 'SD', 'South Dakota'),
    ('47', 'TN', 'Tennessee'),
    ('48', 'TX', 'Texas'),
    ('49', 'UT', 'Utah'),
    ('50', 'VT', 'Vermont'),
    ('51', 'VA', 'Virginia'),
    ('53', 'WA', 'Washington'),
    ('54', 'WV', 'West Virginia'),
    ('55', 'WI', 'Wisconsin'),
    ('56', 'WY', 'Wyoming'),
    ('60', 'AS', 'American Samoa'),
    ('66', 'GU', 'Guam'),
    ('69', 'MP', 'Commonwealth of the Northern Mariana Islands'),
    ('72', 'PR', 'Puerto Rico'),
    ('78', 'VI', 'Virgin Islands')
)

GEOID_TO_STATES = [(s[0], s[2],) for s in STATES]
SHORT_TO_STATES = [(s[1], s[2],) for s in STATES]

ELECTION_STATUS_APPROVED    = 'A'
ELECTION_STATUS_PENDING     = 'P'
ELECTION_STATUS_ARCHIVED    = 'Z'
ELECTION_STATUS_DELETED     = 'D'

ELECTION_STATUSES = (
    (ELECTION_STATUS_APPROVED,  'Approved'),
    (ELECTION_STATUS_PENDING,   'Pending'),
    (ELECTION_STATUS_ARCHIVED,  'Archived'),
    (ELECTION_STATUS_DELETED,   'Deleted'),
)

FILTER_ELECTION_STATUSES = (
    (ELECTION_STATUS_APPROVED,  'Approved'),
    (ELECTION_STATUS_PENDING,   'Pending'),
    (ELECTION_STATUS_ARCHIVED,  'Archived'),
)

ADMIN_TITLES_DEFAULT = "EAR"
ADMIN_TITLES = (
    ("EAR", "Elections Administrator"),
    ("EOL", "Election Official"),
    ("LEO", "Local Election Official"),
    ("SOE", "Supervisor of Elections"),
    ("VOR", "Voter Registrar"),
    ("CMM", "Commissioner"),
    ("CIK", "Circuit Clerk"),
    ("CCK", "City Clerk"),
    ("CTC", "County Clerk"),
    ("DIC", "District Clerk"),
    ("MUC", "Municipal Clerk"),
    ("TCK", "Town Clerk"),
    ("AVC", "Absentee Voter Clerk"),
    ("ABC", "Absentee Ballot Coordinator"),
    ("DCM", "Democratic Commissioner"),
    ("RCM", "Republican Commissioner"),
    ("VRR", "Voter Registrar, Republican"),
    ("VRD", "Voter Registrar, Democratic"),
    ("ACL", "Assistant Clerk"),
    ("AEA", "Assistant Elections Administrator"),
    ("ACI", "Assistant Circuit Clerk"),
    ("ACC", "Assistant County Clerk"),
    ("ADC", "Assistant District Clerk"),
    ("AMC", "Assistant Municipal Clerk"),
    ("ATC", "Assistant Town Clerk"),
    ("DUC", "Deputy Clerk"),
    ("DEC", "Deputy Commissioner"),
    ("DDC", "Deputy Democratic Commissioner"),
    ("DRC", "Deputy Republican Commissioner"),
    ("DRR", "Deputy Registrar"),
    ("OTH", "Other"),
)

# multiple fields per election
# don't forget to update templates/manager/dashboard/election_view.html
# if you added a new ELECTION_DATE_XXX value
ELECTION_DATE_DOMESTIC_REGISTRATION_DEADLINE   = 'DRD'
ELECTION_DATE_DOMESTIC_BALLOT_REQUEST_DEADLINE = 'DBRD'
ELECTION_DATE_DOMESTIC_BALLOT_RETURN_DEADLINE  = 'DBED'

ELECTION_DATE_OVERSEAS_REGISTRATION_DEADLINE   = 'ORD'
ELECTION_DATE_OVERSEAS_BALLOT_REQUEST_DEADLINE = 'OBRD'
ELECTION_DATE_OVERSEAS_BALLOT_RETURN_DEADLINE  = 'OBED'

ELECTION_DATE_MILITARY_REGISTRATION_DEADLINE   = 'MRD'
ELECTION_DATE_MILITARY_BALLOT_REQUEST_DEADLINE = 'MBRD'
ELECTION_DATE_MILITARY_BALLOT_RETURN_DEADLINE  = 'MBED'

# single field per election
ELECTION_DATE_EARLY_VOTING_FROM                = 'EVF'
ELECTION_DATE_EARLY_VOTING_TO                  = 'EVT'

ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_FROM   = 'AVF'
ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_TO     = 'AVT'

ELECTION_DOMESTIC_DATES = (
    ELECTION_DATE_DOMESTIC_REGISTRATION_DEADLINE,
    ELECTION_DATE_DOMESTIC_BALLOT_REQUEST_DEADLINE,
    ELECTION_DATE_DOMESTIC_BALLOT_RETURN_DEADLINE,
)

ELECTION_OVERSEAS_DATES = (
    ELECTION_DATE_OVERSEAS_REGISTRATION_DEADLINE,
    ELECTION_DATE_OVERSEAS_BALLOT_REQUEST_DEADLINE,
    ELECTION_DATE_OVERSEAS_BALLOT_RETURN_DEADLINE,
)

ELECTION_MILITARY_DATES = (
    ELECTION_DATE_MILITARY_REGISTRATION_DEADLINE,
    ELECTION_DATE_MILITARY_BALLOT_REQUEST_DEADLINE,
    ELECTION_DATE_MILITARY_BALLOT_RETURN_DEADLINE,
)

ELECTION_DATES = (
    (ELECTION_DATE_DOMESTIC_REGISTRATION_DEADLINE,      'Domestic Registration Deadline'),
    (ELECTION_DATE_DOMESTIC_BALLOT_REQUEST_DEADLINE,    'Domestic Ballot Request Deadline'),
    (ELECTION_DATE_DOMESTIC_BALLOT_RETURN_DEADLINE,     'Domestic Ballot Return Deadline'),

    (ELECTION_DATE_OVERSEAS_REGISTRATION_DEADLINE,      'Overseas Registration Deadline'),
    (ELECTION_DATE_OVERSEAS_BALLOT_REQUEST_DEADLINE,    'Overseas Ballot Request Deadline'),
    (ELECTION_DATE_OVERSEAS_BALLOT_RETURN_DEADLINE,     'Overseas Ballot Return Deadline'),

    (ELECTION_DATE_MILITARY_REGISTRATION_DEADLINE,      'Military Registration Deadline'),
    (ELECTION_DATE_MILITARY_BALLOT_REQUEST_DEADLINE,    'Military Ballot Request Deadline'),
    (ELECTION_DATE_MILITARY_BALLOT_RETURN_DEADLINE,     'Military Ballot Return Deadline'),

    (ELECTION_DATE_EARLY_VOTING_FROM,                   'Early Voting From'),
    (ELECTION_DATE_EARLY_VOTING_TO,                     'Early Voting To'),

    (ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_FROM,      'In-Person Absentee Voting From'),
    (ELECTION_DATE_IN_PERSON_ABSENTEE_VOTING_TO,        'In-Person Absentee Voting To'),
)
