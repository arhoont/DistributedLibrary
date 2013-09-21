import json
import urllib
from django.core.mail import EmailMultiAlternatives
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction, connection
from django.http import HttpResponse
from django.shortcuts import render_to_response

from library.f_lib import *
from library.models import *

def takeBI(request):
    query = json.loads(str(request.body.decode()))
    info = query["info"]
    bi_id = query["bi_id"]

    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    item=BookItem.objects.get(pk=bi_id)

    message=Message(item=item,personFrom=person,personTo=item.reader,date=timezone.now(),isRead=0)
    message.save()
    item.reader=person
    item.save()

    ss = SysSetting.objects.latest('id')
    mail_title = 'Новое сообщение'

    text_content = 'У вас забрали книгу: '
    html_content = 'У вас забрали книгу: '

    text_content += item.book.title +'\n'+'id экземпляра: '+ str(item.id)+'\n'+ss.system_address+\
                    'Ответьте на запрос\n' + \
                    '\n\nРаспределенная библиотека.'

    html_content += '<strong>' + item.book.title + '</strong><br>' \
                    'id экземпляра: '+ str(item.id) +'<br>'+ss.system_address + \
                    '<br>Ответьте на запрос' + \
                    '<br><br>Распределенная библиотека.'

    sendEmail(mail_title,text_content,html_content,[message.personTo.email])

    return HttpResponse(json.dumps({"info": 1}))


def countInMessage(request):
    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    count=Message.objects.filter(personTo=person,isRead=0).count()


    return HttpResponse(json.dumps({"info": 1,'count':count}))

def getMessages(request):
    query = json.loads(str(request.body.decode()))
    mType = query["mType"]
    isRead = query["isRead"]

    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    if mType=="in":
        messages=Message.objects.filter(personTo=person).order_by('date')[:50]

    formattedMess=[]

    for mess in messages:
        formattedMess.append({"id": mess.id, "personFrom": mess.personFrom.natural_key(),
                            "date": mess.date, "item_id": mess.item.id, "book": mess.item.book.title, "isRead":mess.isRead})
    return HttpResponse(json.dumps({"info": 1, "messages": formattedMess}, cls=DjangoJSONEncoder))


def readMessage(request):
    query = json.loads(str(request.body.decode()))
    info = query["info"]

    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    Message.objects.filter(personTo=person).update(isRead=1)

    return HttpResponse(json.dumps({"info": 1}))

