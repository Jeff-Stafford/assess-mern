
from django.contrib.auth.decorators import login_required, permission_required
from django.conf.urls import url, include
from rest_framework import routers

from eod.models import State, LocalOfficial, LocalOfficialCorrection
from eod import views

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'states', views.StateViewSet)
router.register(r'counties', views.CountyViewSet)
router.register(r'municipalities', views.MunicipalityViewSet)
router.register(r'regions', views.VotingRegionViewSet)
router.register(r'addresses', views.AddressViewSet)
router.register(r'offices', views.LocalOfficialViewSet)
router.register(r'officials', views.OfficerViewSet)


def _correction(*args, **kwargs):
    lo = LocalOfficialCorrection.objects.get(pk=kwargs.get('pk')).local_official
    return "%s, %s" % (lo.region.name, lo.region.state.name)


def _correction_state(*args, **kwargs):
    s = State.objects.get(pk=kwargs.get('pk'))
    # return [lo.region.name, lo.region.state.name,]
    return s.name


def _local_official_detail(*args, **kwargs):
    from eod.models import LocalOfficialCorrection
    lo = LocalOfficial.objects.get(pk=kwargs.get('pk'))
    # return [lo.region.name, lo.region.state.name,]
    return lo.region.name


urlpatterns = [
    # url(r'^ajax_election_locations$', views.election_locations_list, name='ajax_election_locations'),
    # url(r'^ajax_date_type_render$', views.date_type_render, name='ajax_date_type_render'),
    # url(r'^docs$', views.docs, name='docs'),

    # This path is deprecated and will be removed
    url(r'^v2/eod/docs\/*$', views.docs, name='eod-docs'),
    url(r'^v2/eod/', include(router.urls)),

    # every time we change/add new API endpoint, we must change add/change config for the proxy nginx.
    # See election-manager-deployment/blob/master/elasticbeanstalk/semiproduction/.ebextensions/02-nginx-proxy.config#L65
    url(r'^eod/v3/', include(router.urls)),
    url(r'^eod/v3/docs\/*$', views.docs, name='eod-docs'),

    url(r'corrections/$', views.CorrectionList.as_view(), {'breadcrumb': 'Corrections'}, name='corrections'),
    url(r'corrections/states/$', views.CorrectionListByStates.as_view(), {'breadcrumb': 'By State'}, name='corrections-by-states'),
    url(r'corrections/states/(?P<pk>\d+)/$', views.CorrectionStateList.as_view(), {'breadcrumb': _correction_state }, name='corrections-by-state'),
    url(r'corrections/states/(?P<state_id>\d+)/(?P<pk>\d+)/$', views.LocalOfficialDetail.as_view(), {'breadcrumb': _local_official_detail }, name='local-official-detail'),
    url(r'corrections/(?P<pk>\d+)/update$', views.LocalOfficialDetailRedirect.as_view(), {'breadcrumb': _local_official_detail }, name='local-official-detail-redirect'),

    url(r'local_officials/(?P<local_official_id>\d+)/officers/(?P<officer_id>\d+)/snapshot/$', views.LocalOfficialOfficerSnapshot.as_view(), {'breadcrumb': _local_official_detail }, name='local_official_officer_snapshot'),

    url(r'corrections/states/export$', views.ExportStates.as_view(), name='export-all-states'),
    url(r'corrections/states/(?P<pk>\d+)/export$', views.ExportStates.as_view(), name='export-state'),
    url(r'corrections/states/export/(?P<task_id>[0-9a-fA-F\-]+)/status/$', views.ExportStatus.as_view(), name='export-status'),
    url(r'corrections/states/export/(?P<task_id>[0-9a-fA-F\-]+)/download/$', views.DownloadExportedFile.as_view(), name='download-exported-file'),

    url(r'corrections/(?P<pk>\d+)/$', views.CorrectionDetail.as_view(), {'breadcrumb': _correction }, name='correction-detail'),
    url(r'corrections/(?P<pk>\d+)/compare$', views.CorrectionHistoryDetail.as_view(), {'breadcrumb': _correction }, name='correction-compare'),

    # TODO: remove?
    # url(r'corrections/(?P<pk>\d+)/request$', views.SendRequestForUpdates.as_view(), name='send-request-for-updates'),

    url(r'corrections/(?P<request_id>[0-9a-fA-F\-]+)/submit/$', views.PublicSubmitUpdates.as_view(), name='public-submit-updates'),
    url(r'corrections/legacy/(?P<local_official_id>\d+)/submit/$', views.LegacyPublicSubmitUpdates.as_view(), name='legacy-public-submit-updates'),
]
