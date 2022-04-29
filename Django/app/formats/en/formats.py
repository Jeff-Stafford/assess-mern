# HERE FORMATING AS shown in:
# LIST: https://docs.djangoproject.com/en/dev/ref/templates/builtins/#date
DATE_FORMAT = 'm/d/Y'
TIME_FORMAT = 'h:iA'
DATETIME_FORMAT = 'm/d/Y h:iA'
YEAR_MONTH_FORMAT = 'F Y'
MONTH_DAY_FORMAT = 'F j'
SHORT_DATE_FORMAT = 'm/d/Y'
SHORT_DATETIME_FORMAT = 'm/d/Y P'
FIRST_DAY_OF_WEEK = 1

# BUT here use the Python strftime format syntax,
# LIST: http://docs.python.org/library/datetime.html#strftime-strptime-behavior

DATE_INPUT_FORMATS = (
    '%m/%d/%Y',     # '03/21/2014'
    '%m-%d-%Y',     # '03-21-2014'
)
TIME_INPUT_FORMATS = (
    '%I:%M%p',        # '17:59'
    '%H:%M:%S',     # '17:59:59'
    '%H:%M',        # '17:59'
)
DATETIME_INPUT_FORMATS = (
    '%m-%d-%Y %H:%M',     # '03/21/2014 17:59'
    '%m/%d/%Y %H:%M',     # '03/21/2014 17:59'
    '%m/%d/%Y %I:%M%p',     # '03/21/2014 11:59pm'
)

DECIMAL_SEPARATOR = u'.'
THOUSAND_SEPARATOR = u','
NUMBER_GROUPING = 3