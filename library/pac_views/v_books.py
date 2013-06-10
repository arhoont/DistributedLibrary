from functools import reduce
import json
from PIL import Image
from django.core import serializers
from django.core.files.base import ContentFile
from django.db import transaction
from django.http import HttpResponse
from django.db.models import Q
import operator

from library.f_lib import *
from library.models import *

def addItem(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    val = query["val"]

    person = Person.objects.get(pk=request.session["person_id"])
    if not person: # not registred
        return HttpResponse(json.dumps({"info": 4}))
    book = Book.objects.get(pk=isbn)

    bi = BookItem(book=book, owner=person, reader=person, value=val, status=1)
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

    book = Book(isbn=isbn, ozon=link, title=title, language=language, description=desc, date=timezone.now())
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

    bi = BookItem(book=book, owner=person, reader=person, value=val,status=1)
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
    bookslist = Book.objects.order_by("-date")[:count]

    bookslist = serializers.serialize("json", bookslist, use_natural_keys=True,
                                      fields=('isbn','title', 'language', 'authors'))
    return HttpResponse(bookslist)


def loadItems(request):
    query = json.loads(str(request.body.decode()))
    isbn = query["isbn"]
    bilist = [bi.getValues() for bi in Book.objects.get(pk=isbn).bookitem_set.filter(status=1)]

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