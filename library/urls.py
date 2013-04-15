from django.conf.urls import patterns, url
from library import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^error/$', views.badreg, name='badreg'),
    url(r'^signin/$', views.signin, name='signin'),
    url(r'^logout/$', views.logout, name='logout'),
    (r'^getbooks', views.getbooks),
)