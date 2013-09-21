from django.http import HttpResponse, HttpResponseRedirect
import json

from library.f_lib import *
from library.models import *


def regajax(request):
    """
    Registration method
    """
    query = json.loads(str(request.body.decode()))
    login = query["login"]
    email = query["email"]
    fname = query["fname"]
    lname = query["lname"]
    pwd = query["pwd"]
    phone_ext = query["phone_ext"]

    p = Person.objects.filter(email=email, domain=" ")
    if p:
        return HttpResponse(json.dumps({"info": 2}))
    p = Person.objects.filter(login=login, domain=" ")
    if p:
        return HttpResponse(json.dumps({"info": 3}))

    salt = randstring(10)
    pwd_hash = strHash(strHash(pwd) + salt)
    d = Domain.objects.get(pk=" ")
    p = Person(domain=d, login=login, email=email, fname=fname, lname=lname, phone_ext=phone_ext, mobile="",
               pwd=pwd_hash, salt=salt, adm=0, status=1)
    p.save()
    return HttpResponse(json.dumps({"info": 1, "domain": " "}))


def editPassword(person, newPwd):
    salt = randstring(10)
    pwd_hash = strHash(strHash(newPwd) + salt)
    person.pwd = pwd_hash
    person.salt = salt
    person.save()


def passwordRecovery(request):
    query = json.loads(str(request.body.decode()))
    email = query["email"]
    person = Person.objects.filter(email=email)
    if not person:
        return HttpResponse(json.dumps({"info": 2}))
    person = person[0]
    newPwd = randstring(7)
    editPassword(person, newPwd)
    sendEmail("Восстановление пароля",
              'Логин: ' + person.login + '\nНовый пароль: ' + newPwd,
              'Логин: <strong>' + person.login + '</strong><br>Новый пароль: <strong>' + newPwd + '</strong>',
              [email])
    return HttpResponse(json.dumps({"info": 1}))


def editUserAjax(request):
    query = json.loads(str(request.body.decode()))
    field = query["field"]
    param = query["param"]

    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    if field != 'pwd':
        person.__dict__[field] = param
        person.save()
    else:
        pwd = query["old-pwd"]
        passHash = strHash(strHash(pwd) + person.salt)
        if passHash == person.pwd:
            editPassword(person, param)
        else:
            return HttpResponse(json.dumps({"info": 2, "val": param}))
    return HttpResponse(json.dumps({"info": 1, "val": param}))


def checkUser(request):
    query = json.loads(str(request.body.decode()))
    qtype = query["qtype"]
    info = query["info"]
    if qtype == "login":
        p = Person.objects.filter(domain=" ", login=info)
    elif qtype == "email":
        p = Person.objects.filter(domain=" ", email=info)

    if p:
        return HttpResponse(json.dumps({"info": 1}))

    return HttpResponse(json.dumps({"info": 2}))


def askBookItem(request):
    query = json.loads(str(request.body.decode()))
    info = query["info"]
    bi_id = query["bi_id"]
    item = BookItem.objects.get(pk=bi_id)
    context = isauth(request)
    if registrRevers(context):
        return HttpResponse(json.dumps({"info": 4}))
    person = context["person"]

    return HttpResponse(json.dumps({"info": 1,
                                    "text": item.reader.email + "?" + "Subject=" + "Взять книгу" + "&" + "body=" +
                                            "Здравствуйте, " + item.reader.natural_key() + "%0A%0A" +
                                            "Хочу взять книгу: %D1%84"+item.book.title+" id: "+str(item.id)+"%0A"+
                                            "Где и когда вас можно найти?"+"%0A%0A"+
                                            "С уважением, "+person.natural_key()}))