from django.conf.urls import patterns, url
from library import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^error/$', views.badlogin, name='badlogin'),
    url(r'^signin/$', views.signin, name='signin'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^registr/$', views.registr, name='registr'),
    (r'^getbooks', views.getbooks),
)