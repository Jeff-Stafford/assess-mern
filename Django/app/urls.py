"""app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin
from ses import views as ses_views
from app import static_views

urlpatterns = [
    url(r'^bounces$',               ses_views.handle_bounce, name='handle_bounce'),
    url(r'^static/(?P<path>.*)$',   static_views.serve),  # HACK
    url(r'^admin/',                 admin.site.urls),
    url(r'^nested_admin/',          include('nested_admin.urls')),
    url(r'^',                       include('api.urls', namespace='api') ),
    url(r'^',                       include('eod.urls', namespace='eod') ),
    url(r'^api-auth/',              include('rest_framework.urls', namespace='rest_framework')),
    url(r'^user/',                  include('user.urls', namespace='user', app_name='user')),
    url(r'^',                       include('manager.urls', namespace='manager', app_name='manager')),
]

if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [url(r'^__debug__/', include(debug_toolbar.urls))] + urlpatterns
    except:
        pass

