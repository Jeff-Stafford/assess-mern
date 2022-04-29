"""
Django settings for app project.
"""

import os
import sys

from django.contrib import admin

ADMINS = [
    ('Admin', 'api-errors@usvotefoundation.org'),
]

APPEND_SLASH = True

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.9/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'a+-8t(dx9r^pz7*9u_=$f58w#li&e4=4-bq)ac*&()*&%&eo2%'

ELECTION_MANAGER_ENV = os.environ.get('ELECTION_MANAGER_ENV', 'DEV').upper()
# print("Environment: ", ELECTION_MANAGER_ENV)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = ELECTION_MANAGER_ENV == 'DEV'

ALLOWED_HOSTS = [
    '127.0.0.1', 'localhost',
    '.usvotefoundation.org',
]
# this makes sure the app is available for checks by the load balancer and other
# checks to see if the app is alive.
ALLOWED_HOSTS += ['10.0.0.%s' %i for i in range(256) if i > 0]


ELECTION_MANAGER_HOST = os.environ.get('ELECTION_MANAGER_HOST')
if ELECTION_MANAGER_HOST:
    if ',' in ELECTION_MANAGER_HOST:
        for h in ELECTION_MANAGER_HOST.split(','):
            if h and h.strip():
                ALLOWED_HOSTS.append(h.strip())
    else:
        ALLOWED_HOSTS.append(ELECTION_MANAGER_HOST)

# allow access to the app from the hostname(loopback)
try:
    import socket
    LOCAL_IP = str(socket.gethostbyname(socket.gethostname()))
    if LOCAL_IP:
        ALLOWED_HOSTS.append(LOCAL_IP)
except:
    pass

# get internal instance IP
if ELECTION_MANAGER_ENV != 'DEV':
    try:
        from urllib.request import urlopen
        LOCAL_IP = urlopen('http://169.254.169.254/latest/meta-data/local-ipv4').read().decode('utf-8')
        if LOCAL_IP:
            ALLOWED_HOSTS.append(LOCAL_IP)
    except:
        pass

if ELECTION_MANAGER_ENV == 'STAGE':
    ALLOWED_HOSTS = ['*']

# During testing/development all email addresses are replaced in the following way:
# - if email address ends with the one of the STAGE_EMAILS_WHITE_LIST domain then
# the system send email as is
# - if email address doesn't have domain from the white list then the system uses
# STAGE_CORRECTION_EMAILS email(s)
# - otherwise all emails will be sent to bkulbida@bear-code.com and ibrown@bear-code.com

STAGE_EMAILS_WHITE_LIST = [
    '@simulator.amazonses.com',
    '@usvotefoundation.org',
    '@bear-code.com',
    '@gmail.com',
    '@rice.edu'
]
STAGE_CORRECTION_EMAILS = ['bkulbida@bear-code.com', 'ibrown@bear-code.com']


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    #'django.contrib.gis',
    'django_select2',
    'django_celery_beat',
    'django_celery_results',
    'django_fsm',
    'crispy_forms',
    'django_filters',
    'timezone_field',
    'phonenumber_field',
    'nested_admin',
    'formtools',
    'breadcrumbs',
    'bootstrap3',
    'bootstrap3_datetime',
    'compressor',
    'storages',
    'rest_framework',
    'rest_framework.authtoken',
    #'django_markup',
    'ses',
    'bootstrapform',
    'lib',
    'api',
    'eod',
    'commands',
    'manager',
    'svid',
    'user',
    'djangoformsetjs',
]

ADD_ELECTION_GIS_APP = False
if  os.environ.get('ADD_ELECTION_GIS_APP'):
    ADD_ELECTION_GIS_APP = True

#if not ('makemigrations' in sys.argv or 'migrate' in sys.argv) or ADD_ELECTION_GIS_APP:
INSTALLED_APPS += (
    'electiongis',
)

MIDDLEWARE_CLASSES = [
    #'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.http.ConditionalGetMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'breadcrumbs.middleware.BreadcrumbsMiddleware',
    #'django.middleware.cache.FetchFromCacheMiddleware',
]


if DEBUG:

    # toolbar options
    try:
        import debug_toolbar
        # print("settings: debug_toolbar imported")
        INSTALLED_APPS = INSTALLED_APPS + ['debug_toolbar']
        MIDDLEWARE_CLASSES = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE_CLASSES
    except:
        # print("settings: debug_toolbar not found, ignore")
        pass

    INTERNAL_IPS = ['172.18.0.1', '127.0.0.1', 'localhost']
    DEBUG_TOOLBAR_PANELS = [
       'debug_toolbar.panels.versions.VersionsPanel',
       'debug_toolbar.panels.timer.TimerPanel',
       'debug_toolbar.panels.settings.SettingsPanel',
       'debug_toolbar.panels.headers.HeadersPanel',
       'debug_toolbar.panels.request.RequestPanel',
       'debug_toolbar.panels.sql.SQLPanel',
       'debug_toolbar.panels.staticfiles.StaticFilesPanel',
       'debug_toolbar.panels.templates.TemplatesPanel',
       'debug_toolbar.panels.cache.CachePanel',
       'debug_toolbar.panels.signals.SignalsPanel',
       'debug_toolbar.panels.logging.LoggingPanel',
       'debug_toolbar.panels.redirects.RedirectsPanel',
    ]

    DEBUG_TOOLBAR_CONFIG = {
        'INTERCEPT_REDIRECTS': True,
        # 'SHOW_TOOLBAR_CALLBACK' : lambda x: DEBUG,
        'DISABLE_PANELS': {
            'debug_toolbar.panels.templates.TemplatesPanel',
            # 'debug_toolbar.panels.redirects.RedirectsPanel',
        },
    }


ROOT_URLCONF = 'app.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates'),],
        'APP_DIRS': True,
        'OPTIONS': {
            'debug': DEBUG,
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_LOCATION', 'redis:6379'),
    },
}

# Database
# https://docs.djangoproject.com/en/1.9/ref/settings/#databases
if 'RDS_HOSTNAME' in os.environ:

    db_engine = 'django.db.backends.postgresql'
    db_host = os.environ['RDS_HOSTNAME']
    db_port = os.environ['RDS_PORT']

    db_user = os.environ['RDS_USERNAME']
    if 'RDS_USERNAME_OVERRIDE' in os.environ:
        db_user = os.environ['RDS_USERNAME_OVERRIDE']

    db_pass = os.environ['RDS_PASSWORD']
    if 'RDS_PASSWORD_OVERRIDE' in os.environ:
        db_pass = os.environ['RDS_PASSWORD_OVERRIDE']

    DATABASES = {
        'default': {},

        'election_manager': {
            'ENGINE': db_engine,
            'NAME': os.environ.get('DB_ELECTION_MANAGER_NAME', 'election_manager'),
            'USER': db_user,
            'PASSWORD': db_pass,
            'HOST': db_host,
            'PORT': db_port,
        },

        'election_manager_gis': {
            'ENGINE': db_engine,
            'NAME': os.environ.get('DB_ELECTION_MANAGER_GIS_NAME', 'election_manager_gis'),
            'USER': db_user,
            'PASSWORD': db_pass,
            'HOST': db_host,
            'PORT': db_port,
        },

        'election_manager_eod': {
            'ENGINE': db_engine,
            'NAME': os.environ.get('DB_ELECTION_MANAGER_EOD_NAME', 'election_manager_eod'),
            'USER': db_user,
            'PASSWORD': db_pass,
            'HOST': db_host,
            'PORT': db_port,
        },

        # This is used ONLY on dev box via django management command.
        # in order to import production data. Once the data imported - delete this database config block
        # In order to run import script, make sure `eod_legacy` database exists and includes data from production
        'eod_legacy_db': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'eod_legacy',
            'USER': 'django',
            'PASSWORD': 'django',
            'HOST': 'postgres',
            'PORT': '5432',
        },

    }


else:
    DATABASES = {
        'default': {},

        'election_manager': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_ELECTION_MANAGER_NAME', 'election_manager'),
            'USER': os.environ.get('DB_ELECTION_MANAGER_USER', 'django'),
            'PASSWORD': os.environ.get('DB_ELECTION_MANAGER_PASSWORD', 'django'),
            'HOST': os.environ.get('DB_ELECTION_MANAGER_HOST', 'postgres'),
            'PORT': os.environ.get('DB_ELECTION_MANAGER_PORT', '5432'),
        },

        'election_manager_gis': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_ELECTION_MANAGER_GIS_NAME', 'election_manager_gis'),
            'USER': os.environ.get('DB_ELECTION_MANAGER_GIS_USER', 'django'),
            'PASSWORD': os.environ.get('DB_ELECTION_MANAGER_GIS_PASSWORD', 'django'),
            'HOST': os.environ.get('DB_ELECTION_MANAGER_GIS_HOST', 'postgres'),
            'PORT': os.environ.get('DB_ELECTION_MANAGER_GIS_PORT', '5432'),
        },

        'election_manager_eod': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_ELECTION_MANAGER_EOD_NAME', 'election_manager_eod'),
            'USER': os.environ.get('DB_ELECTION_MANAGER_EOD_USER', 'django'),
            'PASSWORD': os.environ.get('DB_ELECTION_MANAGER_EOD_PASSWORD', 'django'),
            'HOST': os.environ.get('DB_ELECTION_MANAGER_EOD_HOST', 'postgres'),
            'PORT': os.environ.get('DB_ELECTION_MANAGER_EOD_PORT', '5432'),
        },

        # This is used ONLY on dev box via django management command.
        # in order to import production data. Once the data imported - delete this database config block
        # In order to run import script, make sure `eod_legacy` database exists and includes data from production
        'eod_legacy_db': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'eod_legacy',
            'USER': 'django',
            'PASSWORD': 'django',
            'HOST': 'postgres',
            'PORT': '5432',
        },

    }

DATABASE_ROUTERS = [
    'eod.import_router.Default',
    'app.routers.APIDBRouter',
]

# Password validation
# https://docs.djangoproject.com/en/1.9/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 6,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

DEFAULT_FROM_EMAIL = "no-reply@localelections.usvotefoundation.org"
SERVER_EMAIL = "app@localelections.usvotefoundation.org"

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.7/howto/static-files/
STATICFILES_DIRS = (
    os.path.realpath(os.path.join(BASE_DIR, 'static')),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'static_precompiler.finders.StaticPrecompilerFinder',
    'compressor.finders.CompressorFinder',
)

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'

COMPRESS_ROOT = STATIC_ROOT = os.path.realpath(os.path.join(BASE_DIR, 'static.dist'))
MEDIA_ROOT = os.path.realpath(os.path.join(BASE_DIR, 'media'))

if ELECTION_MANAGER_ENV == 'DEV':
    ELECTION_MANAGER_SITE_DOMAIN = 'localhost:8888'

    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

    STATIC_PRECOMPILER_OUTPUT_DIR = ''
    COMPRESS_URL = STATIC_URL = '/static/'
    MEDIA_URL = '/media/'
    COMPRESS_OUTPUT_DIR = 'cache'
    COMPRESS_ENABLED = False

    COMPRESS_CSS_FILTERS = (
        'compressor.filters.css_default.CssAbsoluteFilter',
        'compressor.filters.cssmin.CSSMinFilter',
    )

    COMPRESS_STORAGE = 'compressor.storage.CompressorFileStorage'
    COMPRESS_CSS_HASHING_METHOD = 'content'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('ELECTION_MANAGER_EMAIL_HOST', 'localhost')
    EMAIL_PORT = os.environ.get('ELECTION_MANAGER_EMAIL_PORT', '25')
    EMAIL_HOST_USER = os.environ.get('ELECTION_MANAGER_EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('ELECTION_MANAGER_EMAIL_HOST_PASSWORD', '')
    EMAIL_USE_TLS = os.environ.get('ELECTION_MANAGER_EMAIL_USE_TLS', False)

    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'static.localelections.usvotefoundation.org')
    AWS_S3_CALLING_FORMAT = 'boto.s3.connection.OrdinaryCallingFormat'
    AWS_S3_CUSTOM_DOMAIN = 's3.amazonaws.com/%s' % AWS_STORAGE_BUCKET_NAME
    AWS_S3_USE_SSL = False

    STATICFILES_STORAGE = COMPRESS_STORAGE = 'app.s3storage.CachedS3BotoStorage'
    STATIC_URL = '/static/'
    COMPRESS_URL = 'https://s3.amazonaws.com/%s/' % AWS_STORAGE_BUCKET_NAME
    MEDIA_URL = '/media/'
    COMPRESS_CSS_FILTERS = (
        'compressor.filters.css_default.CssAbsoluteFilter',
        'compressor.filters.cssmin.CSSMinFilter',
    )

    COMPRESS_CSS_HASHING_METHOD = 'content'
    COMPRESS_OUTPUT_DIR = 'cache'
    COMPRESS_ENABLED = True
    COMPRESS_OFFLINE = False
    AWS_IS_GZIPPED = False

    AWS_HEADERS = {
        'Expires': 'Thu, 31 Dec 2099 20:00:00 GMT',
        'Cache-Control': 'max-age=94608000',
    }
    AWS_QUERYSTRING_AUTH = False

# Site
SITE_ID = 1

# Internationalization
# https://docs.djangoproject.com/en/1.7/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
FORMAT_MODULE_PATH = 'app.formats'

PHONENUMBER_DEFAULT_REGION = 'US'
PHONENUMBER_DEFAULT_FORMAT = 'NATIONAL'
PHONENUMBER_DB_FORMAT = 'NATIONAL'

#USE_ETAGS = True
DATA_UPLOAD_MAX_NUMBER_FIELDS = 2000

LOGIN_URL = '/user/signin/'
LOGOUT_URL = '/user/signout/'

# Django Rest Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.APILimitOffsetPagination',

    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),

    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'PAGE_SIZE': 100,
    'DEFAULT_CHARSET': 'utf-8',
}

# Celery SETTINGS
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/2')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/3')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
# CELERY_BEAT_SCHEDULE = {
#     'task-send-request-for-election-results': {
#         'task': 'manager.tasks.send_request_for_election_results',
#         'schedule': ''
#     }
# }


SELECT2_JS = '//cdnjs.cloudflare.com/ajax/libs/select2/4.0.2/js/select2.full.js'
SELECT2_CSS = '//cdnjs.cloudflare.com/ajax/libs/select2/4.0.2/css/select2.min.css'

MARKUP_SETTINGS = {
    'textile': {
        'head_offset': 1,
    }
}

CRISPY_TEMPLATE_PACK = 'bootstrap3'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '%(asctime)s [%(levelname)-7s] %(process)d#%(thread)d %(name)s: %(message)s',
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        }
    },
    'handlers': {
        'null': {
           # 'level': 'DEBUG',
           'class': 'logging.NullHandler',
        },
        'console':{
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false']
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.realpath(os.path.join(BASE_DIR, 'logs', 'election_manager.log')),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'eod': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            #'level': 'DEBUG',
        },
        'manager': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            #'level': 'DEBUG',
        },
        'django': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            #'level': 'DEBUG',
        },
        'django.request': {
            'handlers': ['mail_admins', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['mail_admins', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.template': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
        },
        # 'django.security.DisallowedHost': {
        #     'handlers': ['null'],
        #     'propagate': False,
        # },
        'django.db.backends': {
            'level': 'ERROR',
            'handlers': ['console'],
        }
    }
}

# Configure Admin Site
# title/header
admin.site.site_title = "Election Manager Site Admin"
admin.site.site_header = "Election Manager Administration"

# order of apps
ADMIN_REORDER = (
    ('manager', (
        'Election',
        'ElectionResult',
        'ElectionResultDownloadHistory',
        'ElectionLevel',
        'ElectionType',
        'ElectionDateType',
        'URLType'
        )
    ),
    ('svid', (
        'StateVoterInformation',
        'Category'
        'VoterType',
        'DocumentType',
        'DocumentTransmissionMethod',
        'VotingMethodType',
        'EligibilityRequirementList',
        'IdentificationRequirementList',
        'WitnessNotarizationRequirementList',
        )
    ),
    ('eod', (
        'State',
        'County',
        'Municipality',
        'VotingRegion',
        'Address',
        'AddressOfficer',
        'LocalOfficial',
        'Officer',
        )
    )
)

# Load local settings
try:
    from app.local_settings import *
except Exception as e:
    pass
