from django import forms
from django.template.loader import get_template
from django import template

from bootstrapform import config

import pdb


register = template.Library()


def parse_classes(params):
    classes = {
        'form_group': '',
        'ignore_form_group': False,
        'label': '',
        'single_value': '',
        'label_cols': '',
        'value': '',
    }

    data = {}

    if not params:
        params = ''
    params = params.split(',')

    for p in params:
        p = p.strip()
        if not p:
            continue

        (k, v) = p.split('=')
        if not k:
            continue

        k = k.strip()
        v = v.strip()

        if not k in classes:
            if k.startswith('data-'):
                data[k] = v
            continue

        classes[k] = v

    return (classes, data,)


@register.filter
def bootstrap(element, params=None):
    classes, data = parse_classes(params)
    return render(element, classes, data)


@register.filter
def bootstrap_inline(element, params=None):
    markup_classes, data = parse_classes(params)
    if not markup_classes['label']:
        markup_classes['label'] = 'sr-only'
    return render(element, markup_classes, data)


@register.filter
def bootstrap_horizontal(element, params=None):
    markup_classes, data = parse_classes(params)

    for cl in markup_classes['label_cols'].split(' '):
        splited_class = cl.split('-')

        try:
            value_nb_cols = int(splited_class[-1])
        except ValueError:
            value_nb_cols = config.BOOTSTRAP_COLUMN_COUNT

        if value_nb_cols >= config.BOOTSTRAP_COLUMN_COUNT:
            splited_class[-1] = "%d" % config.BOOTSTRAP_COLUMN_COUNT
        else:
            offset_class = cl.split('-')
            offset_class[-1] = 'offset-' + str(value_nb_cols)
            splited_class[-1] = str(config.BOOTSTRAP_COLUMN_COUNT - value_nb_cols)
            markup_classes['single_value'] += ' ' + '-'.join(offset_class)
            markup_classes['single_value'] += ' ' + '-'.join(splited_class)

        markup_classes['value'] += ' ' + '-'.join(splited_class)

    return render(element, markup_classes, data)


def add_input_classes(field, data=None):
    if not is_checkbox(field) and not is_multiple_checkbox(field) and not is_radio(field) \
        and not is_file(field):
        field_classes = field.field.widget.attrs.get('class', '')
        field_classes += ' form-control '
        field.field.widget.attrs['class'] = field_classes
        if 'instance' in field.form and field.form.instance.id:
            field.field.widget.attrs['id'] = ("%s-%s" % (field.html_name, field.form.instance.id))

    if not data:
        return

    for k in data:
        #print k, data[k]
        field.field.widget.attrs[k] = data[k]

def render(element, markup_classes, data):
    element_type = element.__class__.__name__.lower()

    if element_type == 'boundfield':
        add_input_classes(element, data)
        template = get_template("bootstrapform/field.html")
        context = {'field': element, 'classes': markup_classes}
    else:
        has_management = getattr(element, 'management_form', None)
        if has_management:
            for form in element.forms:
                for field in form.visible_fields():
                    add_input_classes(field, data)

            template = get_template("bootstrapform/formset.html")
            context = {'formset': element, 'classes': markup_classes}
        else:
            for field in element.visible_fields():
                add_input_classes(field, data)

            template = get_template("bootstrapform/form.html")
            context = {'form': element, 'classes': markup_classes}

    return template.render(context)


@register.filter
def is_checkbox(field):
    return isinstance(field.field.widget, forms.CheckboxInput)


@register.filter
def is_multiple_checkbox(field):
    return isinstance(field.field.widget, forms.CheckboxSelectMultiple)


@register.filter
def is_radio(field):
    return isinstance(field.field.widget, forms.RadioSelect)


@register.filter
def is_file(field):
    return isinstance(field.field.widget, forms.FileInput)
