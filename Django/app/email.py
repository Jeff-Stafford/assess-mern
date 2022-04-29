import logging
import traceback

from django.conf import settings
from django.contrib.sites.models import Site
from django.contrib.sites.shortcuts import get_current_site
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


email_manager = {
    'email_from': 'U.S. Vote Foundation <eod@usvotefoundation.org>',
    'reply_to': ['eod@usvotefoundation.org'],
    'contact_email': 'eod@usvotefoundation.org',
    'contact_name': 'Jane Scheiring',
    'contact_title1': 'Election Official Directory Content Manager',
    'contact_title2': 'U.S. Vote Foundation and Overseas Vote',
    'contact_url': 'https://www.usvotefoundation.org/contact',
}


def fix_url_protocol(url):
    if not url.startswith('https://') and not url.startswith('http://'):
        if settings.ELECTION_MANAGER_ENV in ['STAGE', 'DEV',]:
            url = 'http://' + url
        else:
            url = 'https://' + url
    return url


def _filter_email_to_address(email_to):
    to = email_to
    if settings.ELECTION_MANAGER_ENV in ['STAGE', 'DEV',]:
        for domain in settings.STAGE_EMAILS_WHITE_LIST:
            if to.endswith(domain):
                return to

        to = settings.STAGE_CORRECTION_EMAILS
        if not to:
            to = ['bkulbida@bear-code.com', 'ibrown@bear-code.com',]

    return to


class Email(object):
    """
    A wrapper around Django's EmailMultiAlternatives that renders txt and html templates.
    """

    def __init__(self, email_from, email_to, email_subject, context=None, headers=None, debug=False):
        self._email_from = email_from or getattr(settings, 'EMAIL_FROM_ADDR')
        self._email_to = email_to
        self._email_subject = email_subject
        self._context = context or {}
        self._headers = headers or {}
        self._debug_backend = debug
        self._html = ''
        self._text = ''


    def _render(self, template):
        return render_to_string(template, self._context)

    def html(self, template):
        self._html = self._render(template)

    def text(self, template):
        self._text = self._render(template)

    def send(self, fail_silently=False):
        if not self._email_from:
            logger.error('Could not send email: email_from is empty')
            return

        if isinstance(self._email_to, str):
            self._email_to = [self._email_to]


        backend = None
        if self._debug_backend:
            backend = 'eod.debug_smtp.EmailBackend'

        with mail.get_connection(backend=backend, fail_silently=fail_silently) as connection:
            msg = EmailMultiAlternatives(
                subject=self._email_subject,
                body=self._text,
                from_email=self._email_from,
                to=self._email_to,
                reply_to=self._context['reply_to'] if 'reply_to' in self._context else None,
                headers=self._headers,
                connection=connection)
            if self._html:
                msg.attach_alternative(self._html, 'text/html')

            result = msg.send(fail_silently)
            logger.debug("Email send %s done, results=%s", msg, result)
            return result


def send_request_for_corrections_email(correction, greeting, email_to):
    to = _filter_email_to_address(email_to)
    if to == email_to:
        logger.debug("send_request_for_corrections_email to %s" % email_to)
    else:
        logger.debug("send_request_for_corrections_email to %s (real: %s)", email_to, to)

    current_site = Site.objects.get_current()
    correction_url = '%s%s' % (current_site.domain, reverse('eod:public-submit-updates', kwargs={'request_id': correction.request_id}))
    correction_url = fix_url_protocol(correction_url)

    context = {
        'greeting': greeting or 'Local Official',
        'leo': correction.local_official,
        'correction_url': correction_url,
        'email_request_id': correction.request_id,
        'domain': current_site.domain,
    }
    context.update(email_manager)

    headers = {}
    headers.setdefault('X-EMAIL-REQUEST-ID', correction.request_id)

    email = Email(email_from=context['email_from'],
                  email_to=to,
                  email_subject='Election Official Data Record Update Request',
                  context=context, headers=headers)
    email.text('email/request_for_corrections.txt')
    email.html('email/request_for_corrections.html')
    return email.send()


def send_corrections_thank_you_email(greeting, email_to):
    to = _filter_email_to_address(email_to)
    if to == email_to:
        logger.debug("send_corrections_thank_you_email to %s" % email_to)
    else:
        logger.debug("send_corrections_thank_you_email to %s (real: %s)", email_to, to)

    context = {
        'greeting': greeting or 'Submitter',
    }
    context.update(email_manager)

    email = Email(email_from=context['email_from'],
                  email_to=to,
                  email_subject='Thanks for Updating Your Election Official Directory Record',
                  context=context)
    email.text('email/corrections_thank_you.txt')
    email.html('email/corrections_thank_you.html')
    return email.send()


def send_activation_email(email_to, activation_url):
    to = _filter_email_to_address(email_to)
    if to == email_to:
        logger.debug("send_activation_email to %s" % email_to)
    else:
        logger.debug("send_activation_email to %s (real: %s)", email_to, to)

    current_site = Site.objects.get_current()
    activation_url = fix_url_protocol(current_site.domain + activation_url)
    context = {
        'activation_url': activation_url,
    }
    context.update(email_manager)

    email = Email(email_from=context['email_from'],
                  email_to=to,
                  email_subject=render_to_string('email/activation_email_subj.html'),
                  context=context)
    email.html('email/activation_email_body.html')
    return email.send()


def send_followup_email(*args, **kwargs):
    pass


def send_asking_for_election_results_email(election, election_upload_results_url, greeting, email_to):
    to = _filter_email_to_address(email_to)
    if to == email_to:
        logger.debug("send_asking_for_election_results_email to %s" % email_to)
    else:
        logger.debug("send_asking_for_election_results_email to %s (real: %s)", email_to, to)

    current_site = Site.objects.get_current()
    election_upload_results_url = '%s%s' % (current_site.domain, election_upload_results_url)
    election_upload_results_url = fix_url_protocol(election_upload_results_url)


    context = {
        'election': election,
        'election_upload_results_url': election_upload_results_url,
        'greeting': greeting,
    }
    context.update(email_manager)

    email = Email(email_from=context['email_from'],
                  email_to=to,
                  email_subject='Election Results Request',
                  context=context)
    email.html('email/elections_asking_for_results.html')
    return email.send()


def send_thank_you_for_election_results_email(greeting, email_to, election_results_date, elections):
    to = _filter_email_to_address(email_to)
    if to == email_to:
        logger.debug("send_thank_you_for_election_results_email to %s" % email_to)
    else:
        logger.debug("send_thank_you_for_election_results_email to %s (real: %s)", email_to, to)

    context = {
        'greeting': greeting,
        'elections': elections,
        'election_results_date': election_results_date,
    }
    context.update(email_manager)

    email = Email(email_from=context['email_from'],
                  email_to=to,
                  email_subject='Thank you for election results',
                  context=context)
    email.html('email/elections_thank_you_for_results.html')
    return email.send()
