from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import signals


def address_used_for(request, idx):
    used_for = request.POST.get("address-{}-used_for".format(idx))
    # 1 - Regular Mail
    # 2 - Express Mail Delivery/Courier
    # 3 - Both Regular Mail & Express Mail Delivery/Courier
    if used_for in ['1', '2', '3']:
        types_address_used_map = {
            '1': (True, False),
            '2': (False, True),
            '3': (True, True)
        }
        return types_address_used_map.get(used_for)
    else:
        return (False, False)


def set_address_usage(request, address, idx):
    address.is_regular_mail = address_used_for(request, idx)[0]
    address.is_physical     = address_used_for(request, idx)[1]
    return (True, address)


def create_paginator(request, collection, items_per_page=20):
    paginator = Paginator(collection, items_per_page)

    page = request.GET.get('page')

    try:
        items = paginator.page(page)
    except PageNotAnInteger:
        items = paginator.page(1)
    except EmptyPage:
        items = paginator.page(paginator.num_pages)

    return items


"""
    Registers any number of application permissions without model

    Examples:

    # .../project/app/models.py
    from django.apps import apps

    register_application_permissions(
        (
            ('can_reboot_server', 'Can Reboot Server',),
        ),
        apps.get_app_config('app_name'))

    # .../project/app/views.py
    if not request.user.has_perm('app.can_reboot_server'):
        return HttpResonseRedirect(login_url)

    To synchronize all permissions with database run the following:
    # ./manage.py migrate


"""
def register_application_permissions(permissions, sender):

    def _sync_permissions(permissions, app, verbosity):

        if verbosity >= 2:
            print("Synchronize '%s' application permissions" % app.label)

        # create content type
        content_type, created = ContentType.objects.get_or_create(model='',
            app_label=app.label,
            defaults={'app_label': app.label})
        if created and verbosity >= 2:
            print("Content type '%s' has been created" % content_type.name)

        # create permissions
        for codename, name in permissions:
            perm, created = Permission.objects.get_or_create(codename=codename,
                content_type__pk=content_type.id,
                defaults={'name': name, 'content_type': content_type})
            if created and verbosity >= 2:
                print("Permission '%s' has been created" % perm.codename)

    def _post_migrate_receiver(sender, **kwargs):
        _sync_permissions(permissions, sender, kwargs.get('verbosity', 0))

    signals.post_migrate.connect(_post_migrate_receiver, sender=sender, weak=False)
