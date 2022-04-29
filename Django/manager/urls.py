from django.conf.urls import include, url
from django.contrib.auth.decorators import user_passes_test
from django.core.urlresolvers import reverse
from django.utils.functional import lazy

from manager import models, views, wizard

def _election(*args, **kwargs):
    election = models.Election.objects.get(pk=kwargs.get('election_id'))
    return "%s" % (election.title)

urlpatterns = [
    url(r'^healthcheck.html',                                   views.health_check),
    url(r'^e/(?P<public_election_id>[0-9a-z]+)/$',              views.show, {'breadcrumb': 'TBD_election' }, name='election_show'),
    url(r'^e/(?P<public_election_id>[0-9a-z]+)/upload$',        views.show_upload_form, {'breadcrumb': 'TBD_election' }, name='election_show_upload_form'),
    url(r'^elections/(?P<election_id>\d+)/$',                   views.create_or_update, {'breadcrumb': _election }, name='election_update'),
    url(r'^elections/(?P<election_id>\d+)/added$',              views.election_added, {'breadcrumb': 'Election Added'}, name='election_added'),
    url(r'^elections/(?P<election_id>\d+)/results',             views.election_results, {'breadcrumb': 'Results' }, name='election_results'),
    url(r'^elections/(?P<election_id>\d+)/download_history',    views.election_download_history, {'breadcrumb': 'Download History'}, name='election_download_history'),
    url(r'^elections/(?P<election_id>\d+)/send_request$',       views.election_send_request_for_results, {'breadcrumb': 'Election Send Request For Results'}, name='election_send_request_for_results'),
    url(r'^elections/$',                                        views.dashboard, {'breadcrumb': 'Elections'}, name='elections'),
    url(r'^elections/results',                                  views.elections_results_list, {'breadcrumb': 'Results'}, name='elections_results_list'),
    url(r'^elections/results/download/(?P<era_id>\d+)/$',       views.election_results_download_link, name='election_results_download_link'),
    url(r'^elections/ajax_download_link_for_elections$',        views.ajax_generate_download_link_for_elections, name='ajax_generate_download_link_for_elections'),
    url(r'^elections/ajax_check_download_link(?P<erdh_id>\d+)/$', views.ajax_check_download_link, name='ajax_check_download_link'),
    url(r'^elections/ajax_get_locations$',                      views.ajax_get_locations, name='ajax_get_locations'),
    url(r'^$',                                                  wizard.index, {'breadcrumb': 'Home'}, name='index'),
    url(r'^(?P<step>.+)$',                                      wizard.election_manager_wizard, {'breadcrumb': 'Home'}, name='election_manager_step'),
]
