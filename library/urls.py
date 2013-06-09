from django.conf.urls import patterns, url
from library import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^login/$', views.login, name='login'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^error/$', views.error, name='error'),
    url(r'^registr/$', views.registr, name='registr'),
    url(r'^book/add/$', views.bookadd, name='bookadd'),
    url(r'^book/info/$', views.bookinfo, name='bookinfo'),
    url(r'^book/edit/$', views.bookedit, name='bookedit'),
    url(r'^signin$', views.signin, name='signin'),
    (r'^getbooks', views.getbooks), # main page
    (r'^regajax', views.regajax), # ajax registration method
    (r'^checkBook', views.checkBook), # check book existence (by isbn)
    (r'^checkUser', views.checkUser), # check user existence (by login)
    (r'^addbajax', views.addbajax), # ajax add book (save information)
    (r'^editbajax', views.editbajax),
    (r'^getlastbooks', views.getlastbooks), # for index page
    (r'^addItem', views.addItem),
    (r'^addOpinion', views.addOpinion),
    (r'^takeReq', views.takeReq), # new take-book message
    (r'^returnReq', views.returnReq), # new return-book message
    (r'^testBIConv', views.testBIConv),
    (r'^getMessages', views.getMessages), # get user's messages (in/out)
    (r'^getRetMessages', views.getRetMessages), # get user's book-return notification
    (r'^replyMessage', views.replyMessage), # reply on some message (yes/no/read)
    (r'^replyRetMessage', views.replyRetMessage), #reply on return-book notification (read)
    (r'^loadItems', views.loadItems), # for bookinfo page
    (r'^uploadBI', views.uploadBI), # upload book image preview on server
)