from django.http import HttpResponse, HttpResponseRedirect
import json

from library.f_lib import *
from library.models import *


def regajax(request):
    query = json.loads(str(request.body.decode()))
    login = query["login"]
    email = query["email"]
    fname = query["fname"]
    lname = query["lname"]
    pwd = query["pwd"]

    p = Person.objects.filter(login=login, domain=" ")
    if p:
        return HttpResponse(json.dumps({"info": 2}))

    salt = randstring(10)
    pwd_hash = strHash(strHash(pwd) + salt)
    d = Domain.objects.get(pk=" ")
    p = Person(domain=d, login=login, email=email, fname=fname, lname=lname, pwd=pwd_hash, salt=salt, adm=0, status=1)
    p.save()
    return HttpResponse(json.dumps({"info": 1, "domain": " "}))


def editUserAjax(request):
    query = json.loads(str(request.body.decode()))
    print(query)
    field = query["field"]
    param = query["param"]
    person = Person.objects.get(pk=request.session["person_id"])

    if field != 'pwd':
        person.__dict__[field] = param
        person.save()
    else:
        salt = randstring(10)
        pwd_hash = strHash(strHash(param) + salt)
        person.pwd = pwd_hash
        person.salt = salt
        person.save()
    return HttpResponse(json.dumps({"info": 1, "val": param}))


def checkUser(request):
    query = json.loads(str(request.body.decode()))
    login = query["login"]
    p = Person.objects.filter(domain=" ", login=login)

    if p:
        return HttpResponse(json.dumps({"info": 1}))
    return HttpResponse(json.dumps({"info": 2}))






