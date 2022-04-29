
from django.dispatch import Signal

from django.db.models.signals import pre_save
from django.dispatch import receiver
from eod.models import LocalOfficial, Officer, Address 

import datetime

bounce_received = Signal(providing_args=["mail_obj", "bounce_obj", "raw_message"])
complaint_received = Signal(providing_args=["mail_obj", "complaint_obj", "raw_message"])


def set_updated_at(instance, sender):
    try:
        obj = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return False
    else:
        obj.updated = datetime.datetime.now()

        print(obj)

    return True
