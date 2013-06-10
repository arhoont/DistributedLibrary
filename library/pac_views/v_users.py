from django.http import HttpResponse, HttpResponseRedirect
import json

from library.f_lib import *
from library.models import *


def regajax(request):
    query = json.loads(str(request.body.decode()))
    log = query["login"]
    email = query["email"]
    fname = query["fname"]
    lname = query["lname"]
    pwd = query["pwd"]

    p = Person.objects.filter(login=log, domain=" ")
    if p:
        return HttpResponse(json.dumps({"info": 2}))

    salt = randstring(10)
    pwd_hash = strHash(strHash(pwd) + salt)
    d = Domain.objects.get(pk=" ")
    p = Person(domain=d, login=log, email=email, fname=fname, lname=lname, pwd=pwd_hash, salt=salt, adm=0, status=1)
    p.save()
    return HttpResponse(json.dumps({"info": 1, "domain": " "}))


def checkUser(request):
    query = json.loads(str(request.body.decode()))
    login = query["login"]
    p = Person.objects.filter(domain=" ", login=login)

    if p:
        return HttpResponse(json.dumps({"info": 1}))
    return HttpResponse(json.dumps({"info": 2}))






