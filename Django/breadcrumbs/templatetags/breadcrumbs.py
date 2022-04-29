import re

from collections import Sequence

from django import template
from django.core.urlresolvers import resolve
from django.template.loader import get_template


register = template.Library()


class BreadcrumbsTagNode(template.Node):

    def _create_url(self, path_parts):
        path = '/'.join(path_parts)
        # append 1st slash
        if (not path and len(path_parts) == 1) or path[0] != '/':
            path = '/' + path
        if path and path[-1] != '/':  # append last
            path += '/'
        return path

    def _iterator(self, path_info):
        """
        Iterate over all request.path_info segments
        Example: if path_info is '/foo/bar/1/' then _iterate will return '/', '/foo/', '/foo/bar/', '/foo/bar/1/'
        """
        url_parts = []
        for url_part in path_info.rstrip('/').split('/'):
            url_parts.append(url_part)
            yield self._create_url(url_parts)

    def _breadcrumb(self, referer, path):
        """
        Read 'breadcrumb' argument from the url definition
        """
        # resolve url for given part of path
        url = path
        try:
            _, _, kwargs = resolve(url)  # try to resolve with the path as is
        except:
            # cannot resolve url
            try:
                url = path.rstrip('/')  # try to resolve without last slash
                _, _, kwargs = resolve(url)
            except:
                return

        # remove breadcrumb from the url definition
        breadcrumb = kwargs.pop('breadcrumb', None)
        if not breadcrumb:
            return

        # wrap if breadcrumb is not a collection
        if isinstance(breadcrumb, str) or not isinstance(breadcrumb, Sequence):
            breadcrumb = [breadcrumb]

        for b in breadcrumb:
            if isinstance(b, str):
                title = b % kwargs
            elif hasattr(b, '__call__'):
                title = b(**kwargs)
            else:
                title = b

            if not title:
                continue

            if referer and url:
                parts = referer.split(url)
                if len(parts) == 2:
                    query = parts[-1]
                    match = re.search('^\?page=\d+', query)
                    if match:
                        url += query

            yield [title, url,]


    def render(self, context):
        request = context['request']
        referer = request.META['HTTP_REFERER'] if 'HTTP_REFERER' in request.META else None

        breadcrumbs = []  # (title, url)
        for url in self._iterator(request.path_info):
            breadcrumbs.extend(self._breadcrumb(referer, url))

        templ = get_template('breadcrumbs/breadcrumbs.html')
        return templ.render({'breadcrumbs': breadcrumbs})


class BreadcrumbsTitleNode(BreadcrumbsTagNode):


    def render(self, context):
        request = context['request']
        referer = request.META['HTTP_REFERER']

        breadcrumbs = []  # (title, url)
        for url in self._iterator(request.path_info):
            breadcrumbs.extend(self._breadcrumb(referer, url))

        templ = get_template('breadcrumbs/breadcrumbs_title.html')
        return templ.render({'breadcrumbs': breadcrumbs})


@register.tag(name='breadcrumbs')
def generate_breadcrumbs(parser, token):
    return BreadcrumbsTagNode()

@register.tag(name='breadcrumbs_title')
def generate_breadcrumbs(parser, token):
    return BreadcrumbsTitleNode()
