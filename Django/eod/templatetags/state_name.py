from django import template
register = template.Library()

@register.simple_tag(name='state_name_by_abbr')
def state_name_by_abbr(state_abbr, states):
    if state_abbr is None or state_abbr == "":
        return ""
    return next(state[1] for state in states if state[0] == state_abbr)
