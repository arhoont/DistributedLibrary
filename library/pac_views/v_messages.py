import json
from django.core.mail import EmailMultiAlternatives
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction, connection
from django.http import HttpResponse

from library.f_lib import *
from library.models import *


@transaction.commit_on_success
def takeReq(request):
    query = json.loads(str(request.body.decode()))

    itemId = query["itemId"]

    personFrom = Person.objects.get(pk=request.session["person_id"])

    if not personFrom:
        return HttpResponse(json.dumps({"info": 4}))

    bi = BookItem.objects.get(pk=itemId)
    (takeb, takep) = bi.checkTake()
    if takeb != 0:
        return HttpResponse(json.dumps({"info": 2}))
    personTo = Person.objects.get(pk=bi.reader_id)

    conv = Conversation(item=bi, personFrom=personFrom, personTo=personTo)
    conv.save()
    conv.message_set.create(date=timezone.now(), mtype=1, isRead=0, resp=1)


    ss = SysSetting.objects.latest('id')
    mail_title = 'Новый запрос'
    if bi.value == 1:
        text_content = 'У вас забрали книгу: '
        html_content = 'У вас забрали книгу: '
    else:
        text_content = 'У вас хотят взять книгу: '
        html_content = 'У вас хотят взять книгу: '

    text_content += bi.book.title +'\n'+'id экземпляра: '+ str(bi.id)+'\n'+ss.system_address+\
                    'Ответьте на запрос\n' + \
                    '\n\nРаспределенная библиотека.'

    html_content += '<strong>' + bi.book.title + '</strong><br>' \
                    'id экземпляра: '+ str(bi.id) +'<br>'+ss.system_address + \
                    '<br>Ответьте на запрос' + \
                    '<br><br>Распределенная библиотека.'

    sendEmail(mail_title,text_content,html_content,[personTo.email])

    return HttpResponse(json.dumps({"info": 1, "biid": bi.id}))


@transaction.commit_on_success
def returnReq(request):
    query = json.loads(str(request.body.decode()))

    itemId = query["itemId"]

    personFrom = Person.objects.get(pk=request.session["person_id"])

    if not personFrom: # not registred
        return HttpResponse(json.dumps({"info": 4}))

    bi = BookItem.objects.get(pk=itemId)
    (takeb, takep) = bi.checkTake()
    if takeb != 0:
        return HttpResponse(json.dumps({"info": 2}))
    rm = ReturnMessage(personTo=bi.owner, personFrom=personFrom, date=timezone.now(), item=bi, isRead=0)
    rm.save()

    return HttpResponse(json.dumps({"info": 1, "biid": bi.id}))


def getRetMessages(request):
    person = Person.objects.get(pk=request.session["person_id"])
    if not person:
        return HttpResponse(json.dumps({"info": 3}))
    retMList = ReturnMessage.objects.filter(personTo=person, isRead=0)
    mesF = [{"id": mess.id, "person": mess.personFrom.natural_key(), "date": mess.date, "item_id": mess.item.id,
             "book": mess.item.book.title} for mess in retMList]

    return HttpResponse(json.dumps({"info": 1, "messages": mesF}, cls=DjangoJSONEncoder))


def getMessages(request):
    query = json.loads(str(request.body.decode()))
    mType = query["mType"]
    isRead = query["isRead"]
    person = Person.objects.get(pk=request.session["person_id"])
    if not person:
        return HttpResponse(json.dumps({"info": 4}))

    cursor = connection.cursor()
    queryStr = ""
    if mType == "in":
        queryStr = 'select mess.id, conversation_id, item_id, "personFrom_id" from library_message mess join library_conversation conv ' \
                   'on mess.conversation_id=conv.id  where  "isRead" = %s and ' \
                   '(("personTo_id"=%s and mType %% 2=1) or ("personFrom_id"=%s and mType %% 2=0))'
    elif mType == "out":
        queryStr = 'select mess.id, conversation_id, item_id, "personTo_id" from library_message mess join library_conversation conv ' \
                   'on mess.conversation_id=conv.id  where  "isRead" = %s and ' \
                   '(("personTo_id"=%s and mType %% 2=0) or ("personFrom_id"=%s and mType %% 2=1))'

    cursor.execute(queryStr, (isRead, person.id, person.id))
    messages = cursor.fetchall()
    cursor.close()
    formatedMes = []
    for mess in messages:
        message = Message.objects.get(pk=mess[0])

        bi = BookItem.objects.get(pk=mess[2])
        p_new = Person.objects.get(pk=mess[3])

        formatedMes.append({"id": message.id, "person": p_new.natural_key(),
                            "date": message.date, "item_id": bi.id, "book": bi.book.title,
                            "bi_val": bi.value, "resp": message.resp, "mtype": message.mtype})

    return HttpResponse(json.dumps({"info": 1, "messages": formatedMes}, cls=DjangoJSONEncoder))


@transaction.commit_on_success
def replyMessage(request):
    query = json.loads(str(request.body.decode()))
    mess_id = query["mess_id"]
    resp = query["resp"]

    person = Person.objects.get(pk=request.session["person_id"])

    if not person:
        return HttpResponse(json.dumps({"info": 4}))

    mess = Message.objects.get(pk=mess_id)
    conv = mess.conversation
    bi = conv.item

    mess.isRead = 1
    mess.save()

    if mess.mtype == bi.value or mess.resp == 2:
        return HttpResponse(json.dumps({"info": 1}))

    mess_new = Message(conversation=conv, date=timezone.now(), mtype=mess.mtype + 1, resp=resp, isRead=0)
    mess_new.save()

    return HttpResponse(json.dumps({"info": 1}))


def replyRetMessage(request):
    query = json.loads(str(request.body.decode()))
    mess_id = query["mess_id"]
    mess = ReturnMessage.objects.get(pk=mess_id)
    mess.isRead = 1
    mess.save()
    return HttpResponse(json.dumps({"info": 1}))


def countInMessage(request):
    person = Person.objects.get(pk=request.session["person_id"])
    if not person:
        return HttpResponse(json.dumps({"info": 4}))
    cursor = connection.cursor()
    queryStr = 'select mess.id, conversation_id, item_id, "personFrom_id" from library_message mess join library_conversation conv ' \
               'on mess.conversation_id=conv.id  where  "isRead" = %s and ' \
               '(("personTo_id"=%s and mType %% 2=1) or ("personFrom_id"=%s and mType %% 2=0))'
    cursor.execute(queryStr, (0, person.id, person.id))
    mess_count_in = cursor.rowcount
    cursor.close()
    return HttpResponse(json.dumps({"info": 1,"count":mess_count_in}))