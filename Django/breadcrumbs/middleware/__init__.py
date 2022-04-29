
class BreadcrumbsMiddleware(object):
    def process_view(self, request, view, args, kwargs):
        # just remove breadcrumb from kwargs
        kwargs.pop('breadcrumb', None)
