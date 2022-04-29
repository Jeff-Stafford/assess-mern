import os
import re
import shutil
import tempfile

from datetime import datetime, timedelta

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

from django.core.files.storage import default_storage
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from manager import models


logger = logging.getLogger(__name__)


@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_activation_email(self, email_to, activation_url):
    logger.debug('%s: email_to=%s, activation_url=%s', self.request.id, email_to, activation_url)

    try:
        email.send_activation_email(email_to, activation_url)

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        logger.error("Cannot send 'send_activation_email' to {0}, Exception: {1!s}\n{2!s}".format(
            email_to, exc, traceback.format_exc()))

    logger.debug('%s: results=%s', self.request.id, self.request)



@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_asking_for_election_results_email(self, election, election_upload_results_url, greeting, email_to):
    logger.debug('%s: election=%s, greeting=%s, email_to=%s', self.request.id, election, greeting, email_to)

    try:
        email.send_asking_for_election_results_email(election, election_upload_results_url, greeting, email_to)

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        logger.error("Cannot send 'send_asking_for_election_results_email' to {0}, Exception: {1!s}\n{2!s}".format(
            email_to, exc, traceback.format_exc()))

    logger.debug('%s: results=%s', self.request.id, self.request)


@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_thank_you_for_election_results_email(self, greeting, email_to, election_results_date, elections):
    logger.debug('%s: election_results_date=%s, greeting=%s, email_to=%s, elections=%s', self.request.id, election_results_date, greeting, email_to, elections)

    try:
        email.send_thank_you_for_election_results_email(greeting, email_to, election_results_date, elections)

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        logger.error("Cannot send 'send_thank_you_for_election_results_email' to {0}, Exception: {1!s}\n{2!s}".format(
            email_to, exc, traceback.format_exc()))

    logger.debug('%s: results=%s', self.request.id, self.request)


@celery.app.task(bind=True, default_retry_delay=15, max_retries=10, soft_time_limit=30, task_time_limit=120)
def send_request_for_election_results(self):

    time_threshold = timezone.now() - timedelta(days=14)

    try:
        for election in models.Election.objects.filter(Q(election_date__lte=time_threshold) & Q(request_email_was_sent=0)).all():

            email_to = election.get_contact_email()
            if not email_to:
                logger.error("Election pk={0} has no contact_email and user.email".format(election.id))
                continue

            send_asking_for_election_results_email.delay(election.title,
                reverse('manager:election_show_upload_form', kwargs={'public_election_id': election.get_public_election_id()}),
                'Election Official',
                email_to)

            election.request_email_was_sent += 1
            election.request_email_was_sent_at = datetime.now()
            election.save()

    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        logger.error("Cannot run 'send_request_for_election_results', Exception: {0!s}\n{1!s}".format(exc, traceback.format_exc()))

    logger.debug('%s: results=%s', self.request.id, self.request)


@celery.app.task(bind=True, default_retry_delay=15, max_retries=5, task_time_limit=3600)
def create_election_results_archive(self, election_result_download_history_id):
    if not election_result_download_history_id:
        logger.error("election_result_download_history_id is None")
        return

    try:
        erdh = models.ElectionResultDownloadHistory.objects.get(pk=election_result_download_history_id)
        # if erdh.status != 'PENDING':
        #     logger.error("Cannot run 'create_election_results_archive', ElectionResultDownloadHistory(pk={0}) already processed (status={1}).".format(election_result_download_history_id, erdh.status))
        #     return
        erdh.status = 'PROCESSING'
        erdh.save()
    except models.Election.DoesNotExist:
        logger.error("Cannot run 'create_election_results_archive', ElectionResultDownloadHistory(pk={0}) not found.".format(election_result_download_history_id))
        return None

    tmpdir = None
    ziparchive = None
    try:

        tmpdir = tempfile.mkdtemp(prefix='election-results-')

        # download all attachemnts for all selected elections
        for election_id in erdh.elections_ids:
            _download_election_results(election_id, tmpdir)

        ziparchive = _create_zip_archive(tmpdir)

        s3filename = 'archive-%s-%s.zip' % (len(erdh.elections_ids), datetime.now().strftime("%Y%m%d-%H%M%S"))

        erdh.elections_archive_file.name = _upload_to_storage(ziparchive, s3filename)
        erdh.status = 'READY'
        erdh.save()
    except socket.timeout as exc:
        raise self.retry(countdown=5, exc=exc)

    except SoftTimeLimitExceeded as exc:
        raise self.retry(countdown=5, exc=exc)

    except Exception as exc:
        if erdh:
            erdh.status = 'ERROR'
            erdh.error = 'Cannot create archive. Error: {0!s}'.format(exc)
            erdh.save()

        logger.error("Cannot run 'create_election_results_archive', Exception: {0!s}\n{1!s}".format(exc, traceback.format_exc()))

    finally:
        if tmpdir:
            # cleanup all temp files
            try:
                shutil.rmtree(tmpdir)  # delete directory
            except OSError as exc:
                if exc.errno != errno.ENOENT:  # ENOENT - no such file or directory
                    raise  # re-raise exception
            finally:
                if ziparchive:
                    try:
                        os.remove(ziparchive)
                    except OSError:
                        pass

    logger.debug('%s: results=%s', self.request.id, self.request)


def _download_election_results(election_id, tmpdir=None):

    try:
        election = models.Election.objects.get(pk=election_id)

        if not tmpdir:
            tmpdir = tempfile.mkdtemp(prefix='election-results-%s-' % election_id)

        title = re.sub('[^a-zA-Z0123456789 ]+', '', election.title)
        electiondir = '%s/%s' % (tmpdir, title)
        os.makedirs(electiondir, exist_ok=True)

        bucketdir = 'election_results/%s' % election_id

        dirs, files = default_storage.listdir(bucketdir)
        for filename in files:
            with default_storage.open('%s/%s' % (bucketdir, filename)) as s3file:
                tmpfilename = '%s/%s' % (electiondir, filename.encode("ascii", errors="ignore").decode())
                with open(tmpfilename, 'wb') as tmpfile:
                    while True:
                        bytes_read = s3file.read(1024*1024)
                        if not bytes_read:
                            break
                        tmpfile.write(bytes_read)

        return (tmpdir, electiondir, title)

    except models.Election.DoesNotExist:
        return None

def _create_zip_archive(srcdir):
    f, tmparchive = tempfile.mkstemp(prefix='election-results-archive-')
    os.close(f)
    os.unlink(tmparchive)
    srcdir = '%s/' % srcdir
    return shutil.make_archive(tmparchive, 'zip', srcdir)


def _upload_to_storage(zipname, destname):

    with open(zipname, 'rb') as tmpfile:
        return default_storage.save('election_results/archives/%s' % destname, tmpfile)


@celery.app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):

    # run every midnight
    sender.add_periodic_task(
        crontab(minute=0, hour=0),
        send_request_for_election_results.s(),
        name='send request for election results')
