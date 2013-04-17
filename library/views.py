import hashlib
import random
import string
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.template import Context
from library.models import *
from django.db import connection
from datetime import timedelta
from django.utils import timezone
import json
from library.models import Book
from django.db import transaction

def isauth(request):
    context=Context()
    if request.session.get('person_id', False):
        context['person_id']= request.session["person_id"]
        context['person_login']= request.session["person_login"]
    return context

def index(request):
    context = isauth(request)
    return render(request, 'library/index.html', context)

def error(request):
    context = Context({
        'type': 0
    })
    return render(request, 'library/index.html', context)


def bookadd(request):
    context = isauth(request)
    authors=Author.objects.all()
    keywords=Keyword.objects.all()
    languages=Language.objects.all()

    context["authors"]=authors
    context["keywords"]=keywords
    context["languages"]=languages
    print(context)
    return render(request, 'library/bookadd.html', context)

def login(request):
    context=Context()
    if request.session.get('person_id', False):
        context['person_id']= request.session["person_id"]
        context['person_login']= request.session["person_login"]
    else:
        context['type']= 1
    return render(request, 'library/index.html', context)

def registr(request):
    context = Context()
    return render(request, 'library/registr.html', context)

def randstring(n):
    a = string.ascii_letters + string.digits
    return ''.join([random.choice(a) for i in range(n)])


def strHash(string):
    hash = hashlib.md5()
    hash.update(string.encode())
    return hash.hexdigest()

def regajax(request):
    query=json.loads(str(request.body.decode()))
    log=query["log"]
    email=query["email"]
    fname=query["fname"]
    lname=query["lname"]
    pwd=query["pwd"]

    p=Person.objects.filter(login=log, domain=" ")
    if p:
        return HttpResponse(json.dumps({"info": 2}))

    salt=randstring(10)
    pwd_hash=strHash(strHash(pwd)+salt)
    d=Domain.objects.get(pk=" ")
    p=Person(domain=d, login=log, email=email,fname=fname,lname=lname,pwd=pwd_hash, salt=salt, adm=0, status=1)
    p.save()
    # print(p.login)
    return HttpResponse(json.dumps({"info": 1, "domain":" "}))

def checkBook(request):
    query=json.loads(str(request.body.decode()))
    typeQ=query["type"]
    isbn=query["isbn"]
    title=query["title"]

    if typeQ==1:
        booklist=Book.objects.filter(isbn=isbn)
    if typeQ==2:
        booklist=Book.objects.filter(title__icontains=title)
    if booklist:
        return HttpResponse(json.dumps({"info": 1, "books":[b.getValues() for b in booklist]}))

    return HttpResponse(json.dumps({"info": 2, "books":""}))

def checkUser(request):
    query=json.loads(str(request.body.decode()))
    login=query["login"]
    p=Person.objects.filter(domain=" ", login=login)

    if p:
        return HttpResponse(json.dumps({"info": 1}))
    return HttpResponse(json.dumps({"info": 2}))

@transaction.commit_on_success
def addbajax(request):
    query=json.loads(str(request.body.decode()))
    isbn=query["isbn"]

    book=Book.objects.filter(isbn=isbn)
    if book: # book exists
        return HttpResponse(json.dumps({"info": 2}))

    link=query["link"]
    title=query["title"]
    lang=query["lang"]
    desc=query["desc"]
    val=query["val"]
    authors=set(query["authors"])
    keywords=set(query["keywords"])

    l=Language(language="asda")
    l.save()
    person=Person.objects.get(pk=request.session["person_id"])
    if not person: # not registr
        return HttpResponse(json.dumps({"info": 4}))

    language, created = Language.objects.get_or_create(language=lang)

    book=Book(isbn=isbn,ozon=link,title=title,language=language,description=desc)
    book.save()

    for auth in authors:
        author=auth.split(" ",1)
        author, created = Author.objects.get_or_create(fname=author[0],lname=author[1])
        book.authors.add(author)

    for key in keywords:
        keyw, created = Keyword.objects.get_or_create(word=key)
        book.keywords.add(keyw)

    bi=BookItem(isbn=book,owner=person,reader=person,value=val)
    bi.save()
    bi.itemstatus_set.create(status=1, date=timezone.now())

    return HttpResponse(json.dumps({"info": 1, "isbn" : book.isbn}))


def signin(request):
    username=request.POST.get("username")
    password=request.POST.get("password")
    domain=request.POST.get("domain")
    remember=request.POST.get("remember")
    django_timezone=request.POST.get("django_timezone")
    p=Person.objects.filter(login=username, domain=domain)
    if p:
        salt=p[0].salt
        passHash = strHash(strHash(password)+salt)
        if passHash==p[0].pwd:
            request.session["person_id"]=p[0].id
            request.session["person_login"]=p[0].login
            request.session["django_timezone"]=django_timezone
            if remember=="on":
                request.session.set_expiry(timedelta(days=30))
            else:
                request.session.set_expiry(0)
            return HttpResponseRedirect(reverse('index'))
    return HttpResponseRedirect(reverse('error'))

def logout(request):
    request.session.flush()
    return HttpResponseRedirect(reverse('index'))

def getbooks(request):
    query=json.loads(str(request.body.decode()))
    pageS=int(query["page"]["size"])
    pageN=int(query["page"]["num"])
    start=(pageN-1)*pageS

    if query["search"]["type"]==0 and \
            (query["sort"]["field"]=="isbn" or query["sort"]["field"]=="title" or query["sort"]["field"]=="ozon"):
        if query["sort"]["type"]==0:
            bookslist=[b.getValues() for b in Book.objects.all().order_by(query["sort"]["field"])[start:start+pageS]]
        else:
            bookslist=[b.getValues() for b in Book.objects.all().order_by("-"+query["sort"]["field"])[start:start+pageS]]
        count=Book.objects.count()
    else:
        queryStr="select * from allbooks"

        if query["search"]["type"]==1:
            searchW=query["search"]["word"]
            queryStr += " where isbn like upper('%%" + searchW + \
                        "%%') or upper(ozon) like upper('%%" + searchW + \
                        "%%') or upper(title) like upper('%%" + searchW + \
                        "%%') or upper(language) like upper('%%" + searchW+\
                        "%%') or upper(authors) like upper('%%" + searchW+ \
                        "%%') or upper(keywords) like upper('%%" + searchW+"%%')"
        queryStr += " order by "+query["sort"]["field"]
        if query["sort"]["type"]==1:
            queryStr +=" desc"
        cursor = connection.cursor()
        cursor.execute(queryStr)
        count=cursor.rowcount
        if count>0:
            cursor.scroll(start)
            bookslist = cursor.fetchmany(pageS)
        else:
            bookslist=[]

    return HttpResponse(json.dumps({"info": "yes","count":count, "books":bookslist}))


def castbooks(request):
    d = Domain(domain=" ")
    d.save()

    l = Language(language="Русский")
    l.save()
    # p1=Person(domain=d,login="test1",email="test1@mail.com",fname="ftest1",lname="ltest1",pwd="ptest1",salt="psalt1",adm=1,status=1)
    # p1.save()
    p1 = Person.objects.get(pk=1)
    # p2=Person(domain=d,login="test2",email="test2@mail.com",fname="ftest2",lname="ltest2",pwd="ptest2",salt="psalt1",adm=1,status=1)
    # p2.save()
    p2 = Person.objects.get(pk=2)

    # authors=[]
    # for i in range(10):
    #     authors.append(Author(fname="fauthor"+str(i),lname="lauthor"+str(i),info="ololo"+str(i)))
    #     authors[i].save()
    authors = Author.objects.all()

    # keywords=[]
    # for i in range(10):
    #     keywords.append(Keyword(word="key"+str(i)))
    #     keywords[i].save()
    keywords = Keyword.objects.all()

    # books=[]
    # for i in range(5):
    #     books.append(Book(isbn="123123213"+str(i),ozon="ozon"+str(i),title="title"+str(i),language=l,description="desc"+str(i)))
    #     books[i].save()
    #     books[i].authors.add(authors[i])
    #     books[i].authors.add(authors[i+2])
    #     books[i].keywords.add(keywords[i])
    #     books[i].keywords.add(keywords[i+2])
    #     books[i].keywords.add(keywords[i+3])
    #     for j in range(3):
    #         bi=BookItem(isbn=books[i],owner=p1,reader=p2,value=1)
    #         bi.save()
    #         bi.itemstatus_set.create(status=1, date=timezone.now())

    books = Book.objects.all()
    return HttpResponse(json.dumps({"info": 5}))

