from datetime import datetime
import gzip
import io
import logging
import sys
import traceback
import socket

from app import email
from app import celery

from celery import group
from celery.exceptions import MaxRetriesExceededError, SoftTimeLimitExceeded

from django.core.cache import cache
from django.db import transaction

from eod import models
from eod.export import Exporter


logger = logging.getLogger(__name__)


@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_corrections_thank_you_email(self, greeting, email_to):
    logger.debug('%s: greeting=%s, email_to=%s', self.request.id, greeting, email_to)

    try:
        email.send_corrections_thank_you_email(greeting, email_to)

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        logger.error("Cannot send 'corrections_thank_you_email' to {0}, Exception: {1!s}\n{2!s}".format(
            email_to, exc, traceback.format_exc()))

    logger.debug('%s: results=%s', self.request.id, result)



@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_request_for_updates_email(self, recepient):
    logger.debug('%s: recepient=%s', self.request.id, recepient)

    correction = models.LocalOfficialCorrection.objects.get(pk=recepient['correction_id'])
    email_to = recepient['to']
    result = (False, 'Internal Error')
    try:
        result = email.send_request_for_corrections_email(correction, recepient['greeting'], email_to)
        correction.send_email((True, dict(email_to=email_to)))
        correction.save()
        logger.debug('%s: recepient results=%s', self.request.id, result)
        return

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except MaxRetriesExceededError as exc:
        result = (False, dict(correction_id=correction.pk, email_to=email_to, message="Cannot send email to '%s' after 5 attempts." % email_to))

    except Exception as exc:
        logger.error("Cannot send 'request_for_updates_email' to {0}, correction_id={1}', Exception: {2!s}\n{3!s}".format(
            email_to, correction.pk, exc, traceback.format_exc()))

        result = (False,
                dict(correction_id=correction.pk, email_to=email_to,
                    message="Cannot send email to %s" % (email_to),
                    stacktrace=traceback.format_exc()),)

    correction.send_email(result)
    correction.save()

    logger.debug('%s: recepient results=%s', self.request.id, result)


def send_request_for_updates_email_to_recepients(recepients):
    logger.debug('send_request_for_updates_email=%s', recepients)
    jobs = group(send_request_for_updates_email.s(recepient) for recepient in recepients)
    jobs.apply_async()


@celery.app.task(bind=True, soft_time_limit=120, task_time_limit=240)
def export_local_official_data(self, state_id):
    state = None
    if state_id:
        state = models.State.objects.get(pk=state_id)

    filename_prefix = 'all-local-officials'
    if state:
        filename_prefix = '%s-local-officials' % state.name.lower()
    filename = '%s-%s.xls' % (filename_prefix, datetime.now().strftime("%Y%m%d%H%M%S"))

    def progress_callback(current, total):
        if self.request.is_eager:
            return
        self.update_state(state='PROGRESS', meta={'current': current, 'total': total})

    exporter = Exporter(state_id, progress_callback=progress_callback)
    exporter.run()

    file_in_mem = io.BytesIO()
    exporter.save(file_in_mem)
    cache.set(filename_prefix, self.request.id, 300)
    cache.set(self.request.id, gzip.compress(file_in_mem.getvalue()), 300)  # keep only 5 mins

    return filename
