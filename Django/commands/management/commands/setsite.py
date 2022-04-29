import sys
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import models
from django.contrib.sites.models import Site

class Command(BaseCommand):

    def handle(self, *args, **options):

        site_domain = os.environ.get('ELECTION_MANAGER_SITE_DOMAIN', 'localelections.usvotefoundation.org')

        try:
            site = Site.objects.get(pk=settings.SITE_ID)
            site.domain=site_domain
            site.name=site_domain
            site.save()
            print("'%s' site has been created" % site_domain)
        except Site.DoesNotExist:
            site = Site(domain=site_domain, name=site_domain)
            site.save()
