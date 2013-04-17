from django.conf.urls import patterns, url
from library import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^login/$', views.login, name='login'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^registr/$', views.registr, name='registr'),
    url(r'^bookadd/$', views.bookadd, name='bookadd'),
    (r'^signin', views.signin),
    (r'^getbooks', views.getbooks),
    (r'^regajax', views.regajax),
    (r'^checkBook', views.checkBook),
    (r'^checkUser', views.checkUser),
    (r'^addbajax', views.addbajax),
)