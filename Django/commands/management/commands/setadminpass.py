import sys
import os

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db.utils import DatabaseError,IntegrityError


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            admin_username = os.environ.get('ELECTION_MANAGER_ADMIN_USERNAME', 'admin')
            admin_email = os.environ.get('ELECTION_MANAGER_ADMIN_EMAIL', 'admins@bear-code.com')
            admin_password = os.environ.get('ELECTION_MANAGER_ADMIN_PASSWORD', 'admin2016')

            User.objects.create_superuser(username=admin_username, email = admin_email, password=admin_password)
            print("'%s' account has been created" % admin_username)
        except IntegrityError:
            print("Do Nothing")

        except:
            print("ERROR: ", sys.exc_info()[0])
            raise
