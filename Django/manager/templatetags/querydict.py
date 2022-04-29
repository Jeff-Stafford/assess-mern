import datetime
from django import template

register = template.Library()

@register.simple_tag(takes_context=True)
def is_selected(context, key, id):
    request = context['request']

    sid = '%s' % id
    if request.GET and sid in request.GET.getlist(key):
        return "selected"
    else:
        return ""
