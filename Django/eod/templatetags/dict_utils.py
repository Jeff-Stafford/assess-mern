from collections import Sequence, namedtuple

from django import template
from django.core.urlresolvers import resolve
from django.template import Context
from django.template.loader import get_template
from eod import forms, models

register = template.Library()

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


