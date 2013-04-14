from django.conf.urls import patterns, url
from library import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
)