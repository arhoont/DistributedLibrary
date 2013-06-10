from functools import reduce
import hashlib
import random
import string
from PIL import Image
from django.core import serializers
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.urlresolvers import reverse
from django.db.models import Max, Q
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, render_to_response
from django.template import Context, RequestContext
import operator
from library.models import *
from django.db import connection
from datetime import timedelta
from django.utils import timezone
import json
from library.models import Book
from django.db import transaction
from django.core.serializers.json import DjangoJSONEncoder
from django.core.mail import EmailMultiAlternatives


def cleanTmp(person):
    pis = PersonImage.objects.filter(person=person)
    for pi in pis:
        default_storage.delete(pi.image)
        pi.delete()


def isauth(request):
    context = Context()
    if request.session.get('person_id', False):
        context['person'] = Person.objects.get(pk=request.session["person_id"])
    context['libname'] = SysSetting.objects.latest('id').libname
    return context


def index(request):
    context = isauth(request)
    if context.has_key('person'):
        response = render_to_response('library/home.html', context, context_instance=RequestContext(request))
        active = request.COOKIES.get('active')
        if not active:
            cleanTmp(context['person'])
            response.set_cookie("active", "true")
    else:
        response = render_to_response('library/index.html', context, context_instance=RequestContext(request))
    return response


def error(request):
    context = isauth(request)
    context['type'] = 0
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
    context = isauth(request)
    isbn = request.GET['isbn']
    book = Book.objects.filter(isbn=isbn)
    person = Person.objects.get(pk=request.session["person_id"])
    if len(book) == 0:
        # book not found
        return HttpResponseRedirect(reverse('index'))
    book = book[0]
    btest = Book.objects.filter(Q(isbn=isbn) & Q(bookitem__owner=person)).distinct()

    context["bauthors"] = [a.getPrintName() for a in book.authors.all()]
    context["bkeywords"] = [k.word for k in book.keywords.all()]
    context["bitems"] = book.bookitem_set.all()
    context["bcount"] = book.bookitem_set.all().count()
    context["book"] = book
    context["opinions"] = book.opinion_set.all().order_by("date")
    if btest:
        context["edit"] = "yes"

    return render(request, 'library/bookinfo.html', context)


def bookedit(request):
    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponseRedirect(reverse('index'))

    isbn = request.GET['isbn']
    book = Book.objects.filter(Q(isbn=isbn) & Q(bookitem__owner=1)).distinct()
    if not book:
        return HttpResponseRedirect(reverse('index'))
    book = book[0]
    context = isauth(request)
    context["bauthors"] = [a.getPrintName() for a in book.authors.all()]
    context["bkeywords"] = [k.word for k in book.keywords.all()]
    context["book"] = book

    authors = [a.getPrintName() for a in Author.objects.all()]
    keywords = [k.word for k in Keyword.objects.all()]
    languages = Language.objects.all()
    context["authors"] = authors
    context["keywords"] = keywords
    context["languages"] = languages

    return render(request, 'library/bookedit.html', context)


def login(request):
    context = isauth(request)
    context["registred"] = "yes"
    return render(request, 'library/index.html', context)


def registr(request):
    context = isauth(request)
    return render(request, 'library/registr.html', context)


def error(request):
    context = isauth(request)
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

    return HttpResponse(json.dumps({"info": 1, "biid": bi.id}))


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

    if typeQ == 1:
        book = Book.objects.filter(isbn=isbn)
        if book:
            return HttpResponse(json.dumps({"info": 1, "book": book[0].isbn}))

    return HttpResponse(json.dumps({"info": 2, "books": ""}))


def uploadBI(request):
    if "file" not in request.FILES:
        return HttpResponse(json.dumps({"info": 2}))
        # if "prev_file" in request.POST:
    #     prev_file = request.POST["prev_file"]
    #     if (len(prev_file) > 0):
    #         default_storage.delete(prev_file)

    data = request.FILES['file']
    try:
        img = Image.open(data)
    except BaseException:
        return HttpResponse(json.dumps({"info": 2}))

    img.thumbnail((200, 300), Image.ANTIALIAS)

    exp = data.name.split('.')[-1]
    file_name = default_storage.get_available_name('tmp/book.' + exp)
    path = str(default_storage.location) + '/' + file_name
    img.save(path)

    person = Person.objects.get(pk=request.session["person_id"])
    personImage = PersonImage(person=person, image=file_name)
    personImage.save()

    return HttpResponse(json.dumps({"info": 1, "path": file_name}))


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
    image = query["image"]
    authors = set(query["authors"])
    keywords = set(query["keywords"])
    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registr
        return HttpResponse(json.dumps({"info": 4}))

    language, created = Language.objects.get_or_create(language=lang)
    path = None
    try:
        if len(image) > 0:
            photo = default_storage.open(image)
            exp = photo.name.split('.')[-1]
            path = default_storage.save("book_image/" + isbn + "." + exp, ContentFile(photo.read()))
    except BaseException:
        pass

    book = Book(isbn=isbn, ozon=link, title=title, language=language, description=desc)
    if path:
        book.image = path
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

    return HttpResponse(json.dumps({"info": 1, "biid": bi.id}))


@transaction.commit_on_success
def editbajax(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]

    book = Book.objects.filter(isbn=isbn)[0]

    link = query["link"]
    title = query["title"]
    lang = query["lang"]
    desc = query["desc"]
    image = query["image"]
    authors = set(query["authors"])
    keywords = set(query["keywords"])

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registr
        return HttpResponse(json.dumps({"info": 4}))

    language, created = Language.objects.get_or_create(language=lang)

    if image != book.image:
        try:
            if len(image) > 0:
                photo = default_storage.open(image)
                exp = photo.name.split('.')[-1]
                path = default_storage.save("book_image/" + isbn + "." + exp, ContentFile(photo.read()))
                default_storage.delete(book.image)
                book.image = path
        except BaseException:
            pass

    book.ozon = link
    book.title = title
    book.language = language
    book.description = desc
    book.authors = []
    book.keywords = []
    book.save()

    book.save()

    for auth in authors:
        author = auth.split(" ", 1)
        author, created = Author.objects.get_or_create(fname=author[0], lname=author[1])
        book.authors.add(author)

    for key in keywords:
        keyw, created = Keyword.objects.get_or_create(word=key)
        book.keywords.add(keyw)
    return HttpResponse(json.dumps({"info": 1}))


def getbooks(request):
    query = json.loads(str(request.body.decode()))
    pageS = int(query["page"]["size"])
    pageN = int(query["page"]["num"])
    start = (pageN - 1) * pageS

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponse(json.dumps({"info": 3}))
    sWord = query["search"]["word"]
    orderF = query["sort"]["column"]

    if query["sort"]["type"] == 1:
        orderF = "-" + orderF
    qList = [Q(title__icontains=sWord),
             Q(language__language__icontains=sWord),
             Q(authors__fname__icontains=sWord),
             Q(authors__lname__icontains=sWord),
             Q(keywords__word__icontains=sWord)]

    addQuery = {}
    if (query["search"]["person"] == 1):
        addQuery = {'bookitem__reader': person}
    elif (query["search"]["person"] == 2):
        addQuery = {'bookitem__owner': person}

    bookslist = Book.objects.filter(reduce(operator.or_, qList), **addQuery).distinct().order_by(orderF)[
                start:start + pageS]
    count = Book.objects.filter(reduce(operator.or_, qList), **addQuery).distinct().count()

    bookslist = serializers.serialize("json", bookslist, use_natural_keys=True,
                                      fields=(
                                          'ozon', 'title', 'language', 'authors', 'keywords', 'rating', 'item_count'))

    return HttpResponse(json.dumps({"info": "yes", "count": count, "books": json.loads(bookslist)}))


def getlastbooks(request):
    query = json.loads(str(request.body.decode()))
    count = int(query["count"])
    # bookslist = [[b.isbn, b.title, b.getPrintAuthors(), b.language.language] for b in
    #              Book.objects.all().order_by("isbn")[:count]]

    return HttpResponse(json.dumps({"books": ""}))


def loadItems(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    bilist = [bi.getValues() for bi in Book.objects.get(pk=isbn).bookitem_set.all()]

    return HttpResponse(json.dumps({"info": 1, "bilist": bilist}))


def testBIConv(request):
    query = json.loads(str(request.body.decode()))
    itemId = query["itemId"]
    bi = BookItem.objects.get(pk=itemId)
    (takeb, takep) = bi.checkTake()
    if takeb == 0:
        return HttpResponse(json.dumps({"info": 1}))
    else:
        return HttpResponse(json.dumps({"info": 3}))


@transaction.commit_on_success
def takeReq(request):
    query = json.loads(str(request.body.decode()))

    itemId = query["itemId"]

    personFrom = Person.objects.get(pk=request.session["person_id"])

    if not personFrom: # not registred
        return HttpResponse(json.dumps({"info": 4}))

    bi = BookItem.objects.get(pk=itemId)
    (takeb, takep) = bi.checkTake()
    if takeb != 0:
        return HttpResponse(json.dumps({"info": 2}))
    personTo = Person.objects.get(pk=bi.reader_id)

    conv = Conversation(item=bi, personFrom=personFrom, personTo=personTo)
    conv.save()
    conv.message_set.create(date=timezone.now(), mtype=1, isRead=0, resp=1)


    # ss = SysSetting.objects.latest('id')
    # mail_title = 'Новый запрос'
    # if bi.value == 1:
    #     text_content = 'У вас забрали книгу: '
    #     html_content = 'У вас забрали книгу: '
    # else:
    #     text_content = 'У вас хотят взять книгу: '
    #     html_content = 'У вас хотят взять книгу: '
    #
    # text_content += bi.book.title +'\n'+'id экземпляра: '+ str(bi.id)+'\n'+ss.system_address+'\n\nРаспределенная библиотека.'
    #
    # html_content += '<strong>' + bi.book.title + '</strong><br>' \
    #                 'id экземпляра: '+ str(bi.id) +'<br>'+ss.system_address + \
    #                 '<br><br>Распределенная библиотека.'
    #
    # email = "DLibr <do_not_replay@dlibr.com>"
    # recipients = [personTo.email]
    # msg = EmailMultiAlternatives(mail_title, text_content, email, recipients)
    # msg.attach_alternative(html_content, "text/html")
    # try:
    #     msg.send()
    # except BaseException:
    #     pass

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

