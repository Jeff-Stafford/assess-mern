#
# <Hacks> for Phase1:
# We should remove the following code in the phase 2
# All these hacks only for keeping compatibility with old EOD API (based on Tastypie)
#

import logging

from collections import OrderedDict, namedtuple

from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from rest_framework import relations, serializers

from rest_framework.authentication import TokenAuthentication
from rest_framework import HTTP_HEADER_ENCODING, exceptions
from django.utils.translation import ugettext_lazy as _

def _strip_host(url):
    if not url:
        return url

    pos = url.find("/api/v2/")
    if pos >= 0:
        return url[pos:]
    return url



# Return only 1st relation from the list as a sinlge object
class ManyToSingleRelatedField(relations.ManyRelatedField):
    def to_representation(self, obj):
        return super(ManyToSingleRelatedField, self).to_representation(obj)[0]


# ref: OfficerSerializer
class SingleOffice(serializers.HyperlinkedRelatedField):
    @classmethod
    def many_init(cls, *args, **kwargs):
        list_kwargs = {'child_relation': cls(*args, **kwargs)}
        for key in kwargs.keys():
            if key in relations.MANY_RELATION_KWARGS:
                list_kwargs[key] = kwargs[key]
        return ManyToSingleRelatedField(**list_kwargs)


# strip host part
class HyperlinkedIdentityField(serializers.HyperlinkedIdentityField):
    def get_url(self, *args, **kwargs):
        return _strip_host(super(HyperlinkedIdentityField, self).get_url(*args, **kwargs))


class APILimitOffsetPagination(LimitOffsetPagination):
    max_limit = 100
    default_limit = 20


    def get_paginated_response(self, data):
        meta = OrderedDict([
            ('offset', self.offset),
            ('limit', self.limit),
            ('total_count', self.count),
            ('next', _strip_host(self.get_next_link())),
            ('previous', _strip_host(self.get_previous_link())),
        ])

        return Response(OrderedDict([('meta', meta), ('objects', data)]))


    def get_results(self, data):
        return data['objects']

class EODAuthentication(TokenAuthentication):
    keyword = 'OAuth'

    def authenticate(self, request):
        try:
            creds = super(EODAuthentication, self).authenticate(request)
            if creds:
                return creds

            return self.try_oauth_consumer_key(request)
        except exceptions.AuthenticationFailed:
            raise

    def try_oauth_consumer_key(self, request):
        try:
            oauth_consumer_key = request.GET.get('oauth_consumer_key')
            if not oauth_consumer_key:
                oauth_consumer_key = request.POST.get('oauth_consumer_key')
            if not oauth_consumer_key:
                msg = _('OAuth20Authentication. No consumer_key found.')
                raise exceptions.AuthenticationFailed(msg)

            return self.authenticate_credentials(oauth_consumer_key)

        except UnicodeError:
            msg = _('Error in OAuth20Authentication. oauth_consumer_key string should not contain invalid characters.')
            raise exceptions.AuthenticationFailed(msg)

        except KeyError as e:
            msg = _('Error in OAuth20Authentication.')
            raise exceptions.AuthenticationFailed(msg)

        except Exception as e:
            msg = _('Error in OAuth20Authentication.')
            raise exceptions.AuthenticationFailed(msg)

# </Hacks>
