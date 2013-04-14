from http.cookiejar import domain_match
from django.http import HttpResponse
from django.shortcuts import render
from library.models import *
from django.utils import timezone
import json
# Create your views here.
from library.models import Book


def index(request):
    request.session.set_test_cookie()
    return render(request, 'library/index.html')

def getbooks(request):

    return HttpResponse(json.dumps({"info":request.POST}))

def castbooks(request):
    d=Domain(domain=" ")
    d.save()

    l=Language(language="Русский")
    l.save()
    # p1=Person(domain=d,login="test1",email="test1@mail.com",fname="ftest1",lname="ltest1",pwd="ptest1",salt="psalt1",adm=1,status=1)
    # p1.save()
    p1=Person.objects.get(pk=1)
    # p2=Person(domain=d,login="test2",email="test2@mail.com",fname="ftest2",lname="ltest2",pwd="ptest2",salt="psalt1",adm=1,status=1)
    # p2.save()
    p2=Person.objects.get(pk=2)

    # authors=[]
    # for i in range(10):
    #     authors.append(Author(fname="fauthor"+str(i),lname="lauthor"+str(i),info="ololo"+str(i)))
    #     authors[i].save()
    authors=Author.objects.all()

    # keywords=[]
    # for i in range(10):
    #     keywords.append(Keyword(word="key"+str(i)))
    #     keywords[i].save()
    keywords=Keyword.objects.all()

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

    books=Book.objects.all()
    return HttpResponse(json.dumps({"info":5}))