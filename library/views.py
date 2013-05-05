import hashlib
import random
import string
from django.core.urlresolvers import reverse
from django.db.models import Max
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
from django.core.serializers.json import DjangoJSONEncoder


# pages
#================================================

def isauth(request):
    context = Context()
    if request.session.get('person_id', False):
        context['person'] = Person.objects.get(pk=request.session["person_id"])
    return context


def index(request):
    context = isauth(request)
    if context.has_key('person'):
        return render(request, 'library/home.html', context)
    else:
        return render(request, 'library/index.html', context)


def error(request):
    context = Context({
        'type': 0
    })
    return render(request, 'library/home.html', context)


def bookadd(request): # page
    context = isauth(request)
    authors = [a.getPrintName() for a in Author.objects.all()]
    keywords = [k.word for k in Keyword.objects.all()]
    languages = Language.objects.all()

    context["authors"] = authors
    context["keywords"] = keywords
    context["languages"] = languages
    return render(request, 'library/bookadd.html', context)


def bookinfo(request): # page

    isbn = request.GET['isbn']
    book = Book.objects.filter(isbn=isbn)
    if len(book) == 0:
        # book not found
        return HttpResponseRedirect(reverse('index'))
    book = book[0]
    context = isauth(request)

    # p=Person.objects.
    # if editable
    # context["authors"] = authors
    # context["keywords"] = keywords
    # context["languages"] = languages
    # context["owner"] = True
    # return render(request, 'library/bookadd.html', context)
    #==========================

    bkeywords = [k.word for k in book.keywords.all()]

    context["bauthors"] = [a.getPrintName() for a in book.authors.all()]
    context["bkeywords"] = bkeywords
    context["bitems"] = book.bookitem_set.all()
    context["bcount"] = book.bookitem_set.all().count()
    context["book"] = book
    context["opinions"] = book.opinion_set.all().order_by("date")
    return render(request, 'library/bookinfo.html', context)


def login(request):
    context = Context()
    context["registred"] = "yes"
    return render(request, 'library/index.html', context)


def registr(request):
    context = Context()
    return render(request, 'library/registr.html', context)


def error(request):
    context = Context()
    context["form_error"] = "yes"
    return render(request, 'library/index.html', context)


def logout(request):
    request.session.flush()
    return HttpResponseRedirect(reverse('index'))

#================================================

def randstring(n):
    a = string.ascii_letters + string.digits
    return ''.join([random.choice(a) for i in range(n)])


def strHash(string):
    hash = hashlib.md5()
    hash.update(string.encode())
    return hash.hexdigest()

# user function
#================================================
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
    # print(p.login)
    return HttpResponse(json.dumps({"info": 1, "domain": " "}))


def checkUser(request):
    query = json.loads(str(request.body.decode()))
    login = query["login"]
    p = Person.objects.filter(domain=" ", login=login)

    if p:
        return HttpResponse(json.dumps({"info": 1}))
    return HttpResponse(json.dumps({"info": 2}))


def signin(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    domain = request.POST.get("domain")
    remember = request.POST.get("remember")
    django_timezone = request.POST.get("django_timezone")
    p = Person.objects.filter(login=username, domain=domain)
    if p:
        salt = p[0].salt
        passHash = strHash(strHash(password) + salt)
        if passHash == p[0].pwd:
            request.session["person_id"] = p[0].id
            request.session["person_login"] = p[0].login
            request.session["django_timezone"] = django_timezone
            if remember == "on":
                request.session.set_expiry(timedelta(days=30))
            else:
                request.session.set_expiry(0)
            return HttpResponseRedirect(reverse('index'))
    return HttpResponseRedirect(reverse('error'))

#================================================

def addItem(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    val = query["val"]

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponse(json.dumps({"info": 4}))
    book = Book.objects.get(pk=isbn)

    bi = BookItem(book=book, owner=person, reader=person, value=val)
    bi.save()
    bi.itemstatus_set.create(status=1, date=timezone.now())

    return HttpResponse(json.dumps({"info": 1}))


def addOpinion(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    opiniontext = query["opiniontext"]
    rating = query["rating"]

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponse(json.dumps({"info": 4}))

    book = Book.objects.get(pk=isbn)

    opinion = Opinion(person=person, book=book, date=timezone.now(), rating=rating, text=opiniontext)
    opinion.save()

    return HttpResponse(json.dumps({"info": 1}))


def checkBook(request):
    query = json.loads(str(request.body.decode()))
    typeQ = query["type"]
    isbn = query["isbn"]
    title = query["title"]

    if typeQ == 1:
        booklist = Book.objects.filter(isbn=isbn)
    if typeQ == 2:
        booklist = Book.objects.filter(title__icontains=title)
    if booklist:
        return HttpResponse(json.dumps({"info": 1, "books": [b.getValues() for b in booklist]}))

    return HttpResponse(json.dumps({"info": 2, "books": ""}))


@transaction.commit_on_success
def addbajax(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]

    book = Book.objects.filter(isbn=isbn)
    if book: # book exists
        return HttpResponse(json.dumps({"info": 2}))

    link = query["link"]
    title = query["title"]
    lang = query["lang"]
    desc = query["desc"]
    val = query["val"]
    authors = set(query["authors"])
    keywords = set(query["keywords"])

    l = Language(language="asda")
    l.save()
    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registr
        return HttpResponse(json.dumps({"info": 4}))

    language, created = Language.objects.get_or_create(language=lang)

    book = Book(isbn=isbn, ozon=link, title=title, language=language, description=desc)
    book.save()

    for auth in authors:
        author = auth.split(" ", 1)
        author, created = Author.objects.get_or_create(fname=author[0], lname=author[1])
        book.authors.add(author)

    for key in keywords:
        keyw, created = Keyword.objects.get_or_create(word=key)
        book.keywords.add(keyw)

    bi = BookItem(book=book, owner=person, reader=person, value=val)
    bi.save()
    bi.itemstatus_set.create(status=1, date=timezone.now())

    return HttpResponse(json.dumps({"info": 1, "isbn": book.isbn}))


def getbooks(request):
    query = json.loads(str(request.body.decode()))
    pageS = int(query["page"]["size"])
    pageN = int(query["page"]["num"])
    start = (pageN - 1) * pageS

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponse(json.dumps({"info": 3}))
    bookslist=[]
    count=0
    print(query["search"]["person"])
    if (query["search"]["person"]==1):
        bookslist,count=person.getBooks("reader_id",query["search"]["word"],query["sort"]["type"],query["sort"]["column"],start,pageS)
    elif (query["search"]["person"]==2):
        bookslist,count=person.getBooks("owner_id",query["search"]["word"],query["sort"]["type"],query["sort"]["column"],start,pageS)
    elif (query["search"]["person"]==0):
        bookslist,count=Book.getAllFormated(query["search"]["word"],query["sort"]["type"],query["sort"]["column"],start,pageS)

    return HttpResponse(json.dumps({"info": "yes", "count": count, "books": bookslist}))


def getlastbooks(request):
    query = json.loads(str(request.body.decode()))
    count = int(query["count"])
    bookslist = [[b.isbn, b.title, b.getPrintAuthors(), b.language.language] for b in
                 Book.objects.all().order_by("isbn")[:count]]

    return HttpResponse(json.dumps({"books": bookslist}))

def loadItems(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    bilist=[bi.getValues() for bi in Book.objects.get(pk=isbn).bookitem_set.all()]

    return HttpResponse(json.dumps({"info":1, "bilist": bilist}))


def testBIConv(request):
    query = json.loads(str(request.body.decode()))
    itemId = query["itemId"]
    bi=BookItem.objects.get(pk=itemId)
    (takeb,takep)=bi.checkTake()
    if takeb==0:
        return HttpResponse(json.dumps({"info": 1}))
    else:
        return HttpResponse(json.dumps({"info": 3}))


@transaction.commit_on_success
def takeReq(request):
    query = json.loads(str(request.body.decode()))

    itemId = query["itemId"]

    personFrom = Person.objects.get(pk=request.session["person_id"])

    if not personFrom: # not registred
        return HttpResponse(json.dumps({"info": 3}))

    bi = BookItem.objects.get(pk=itemId)
    (takeb,takep)=bi.checkTake()
    if takeb!=0:
        return HttpResponse(json.dumps({"info": 2}))
    personTo = Person.objects.get(pk=bi.reader_id)

    conv = Conversation(item=bi, personFrom=personFrom, personTo=personTo)
    conv.save()
    conv.message_set.create(date=timezone.now(), mtype=1, isRead=0, resp=1)
    if bi.value==1:
        bi.changeReader(conv.personFrom)

    return HttpResponse(json.dumps({"info": 1}))


def getMessages(request):
    query = json.loads(str(request.body.decode()))
    mType = query["mType"]
    isRead = query["isRead"]
    person = Person.objects.get(pk=request.session["person_id"])
    if not person:
        return HttpResponse(json.dumps({"info": 3}))

    cursor = connection.cursor()
    queryStr = ""
    if mType == "in":
        queryStr = 'select mess.id, conversation_id, item_id, "personFrom_id" from library_message mess join library_conversation conv ' \
                   'on mess.conversation_id=conv.id  where  "isRead" = %s and "personTo_id"=%s'
    elif mType == "out":
        queryStr = 'select mess.id, conversation_id, item_id, "personTo_id" from library_message mess join library_conversation conv ' \
                   'on mess.conversation_id=conv.id  where  "isRead" = %s and "personFrom_id"=%s;'

    cursor.execute(queryStr, (isRead, person.id))
    messages = cursor.fetchall()
    formatedMes = []
    for mess in messages:
        message = Message.objects.get(pk=mess[0])
        # conv=Conversation.objects.get(pk=mess[1])
        bi = BookItem.objects.get(pk=mess[2])
        p_new = Person.objects.get(pk=mess[3])
        formatedMes.append((message.id, bi.id, bi.value, bi.book.title,
                            p_new.getPrintableName(), message.date, message.resp,message.mtype))

    return HttpResponse(json.dumps({"info": 1, "messages": formatedMes}, cls=DjangoJSONEncoder))


@transaction.commit_on_success
def replyMessage(request):
    query = json.loads(str(request.body.decode()))
    mess_id = query["mess_id"]
    resp = query["resp"]

    person = Person.objects.get(pk=request.session["person_id"])

    if not person:
        return HttpResponse(json.dumps({"info": 3}))

    mess = Message.objects.get(pk=mess_id)
    conv = mess.conversation
    bi = conv.item

    mess.isRead = 1
    mess.save()

    if mess.mtype==bi.value or mess.resp==2: # read
        return HttpResponse(json.dumps({"info": 1}))

    mess_new = Message(conversation=conv, date=timezone.now(), mtype=mess.mtype+1, resp=resp, isRead=0)
    mess_new.save()

    if resp==2: # refuse

        return HttpResponse(json.dumps({"info": 1}))

    if resp==1: # ok
        if bi.value==mess_new.mtype:
            bi.changeReader(conv.personFrom)
        return HttpResponse(json.dumps({"info": 1}))

    return HttpResponse(json.dumps({"info": 3}))





