import logging

from ses import signals
from eod import signals as eod_signals

logger = logging.getLogger(__name__)


def _get_header(headers, name):
    for header in headers:
        if header.get('name') == name:
            return header.get('value')
    return None


def _get_email(mail_obj):
    email_to = mail_obj.get('destination', [])
    if len(email_to) >= 1:
        email_to = email_to[0]
    else:
        email_to = None
    return email_to


def bounce_handler(sender, mail_obj, bounce_obj, **kwargs):
    from eod import models
    logger.debug('bounce_handler: mail_obj=%s, bounce_obj=%s', mail_obj, bounce_obj)

    headers = mail_obj.get('headers', [])
    request_id = _get_header(headers, 'X-EMAIL-REQUEST-ID')
    if not request_id:
        logger.debug('bounce_handler: received non-correction bounce')
        return

    try:
        correction = models.LocalOfficialCorrection.objects.get(request_id=request_id)
        correction.email_bounced(dict(email_to=_get_email(mail_obj), bounce=bounce_obj))
        correction.save()

    except models.LocalOfficialCorrection.DoesNotExist:
        logger.warning('bounce_handler: correction not found, request_id=%s', request_id)
        pass


def complaint_handler(sender, mail_obj, complaint_obj, **kwargs):
    from eod import models
    logger.debug('complaint_handler, mail_obj=%s, complaint_obj=%s', mail_obj, complaint_obj)

    headers = mail_obj.get('headers', [])
    request_id = _get_header(headers, 'X-EMAIL-REQUEST-ID')
    if not request_id:
        logger.debug('complaint_handler: received non-correction complaint')
        return

    try:
        correction = models.LocalOfficialCorrection.objects.get(request_id=request_id)
        correction.email_complaint(dict(email_to=_get_email(mail_obj), complaint=complaint_obj))
        correction.save()

    except models.LocalOfficialCorrection.DoesNotExist:
        logger.warning('complaint_handler: correction not found, request_id=%s', request_id)
        pass

# connect to signals
signals.bounce_received.connect(bounce_handler)
signals.complaint_received.connect(complaint_handler)

eod_signals.bounce_received.connect(bounce_handler)
eod_signals.complaint_received.connect(complaint_handler)
