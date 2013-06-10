from django.conf.urls import patterns, url
from library.pac_views import v_pages
from library.pac_views import v_books
from library.pac_views import v_messages
from library.pac_views import v_users

urlpatterns = patterns('',
    url(r'^$', v_pages.index, name='index'),
    url(r'^login/$', v_pages.login, name='login'),
    url(r'^logout/$', v_pages.logout, name='logout'),
    url(r'^error/$', v_pages.error, name='error'),
    url(r'^registr/$', v_pages.registr, name='registr'),
    url(r'^book/add/$', v_pages.bookadd, name='bookadd'),
    url(r'^book/info/$', v_pages.bookinfo, name='bookinfo'),
    url(r'^book/edit/$', v_pages.bookedit, name='bookedit'),
    url(r'^signin$', v_pages.signin, name='signin'),
    url(r'^useredit/$', v_pages.user_edit, name='signin'),

    (r'^checkUser', v_users.checkUser), # check user existence (by login)
    (r'^regajax', v_users.regajax), # ajax registration method
    (r'^editUserAjax', v_users.editUserAjax),

    (r'^getbooks', v_books.getbooks), # main page
    (r'^checkBook', v_books.checkBook), # check book existence (by isbn)
    (r'^addbajax', v_books.addbajax), # ajax add book (save information)
    (r'^editbajax', v_books.editbajax),
    (r'^getlastbooks', v_books.getlastbooks), # for index page
    (r'^addItem', v_books.addItem),
    (r'^addOpinion', v_books.addOpinion),
    (r'^testBIConv', v_books.testBIConv),
    (r'^loadItems', v_books.loadItems), # for bookinfo page
    (r'^uploadBI', v_books.uploadBI), # upload book image preview on server

    (r'^takeReq', v_messages.takeReq), # new take-book message
    (r'^returnReq', v_messages.returnReq), # new return-book message
    (r'^getMessages', v_messages.getMessages), # get user's messages (in/out)
    (r'^getRetMessages', v_messages.getRetMessages), # get user's book-return notification
    (r'^replyMessage', v_messages.replyMessage), # reply on some message (yes/no/read)
    (r'^replyRetMessage', v_messages.replyRetMessage), #reply on return-book notification (read)
    (r'^countInMessage', v_messages.countInMessage), #reply on return-book notification (read)

)