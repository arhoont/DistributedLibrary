from datetime import timedelta
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response, render
from django.template import RequestContext
from library.f_lib import *
from library.models import *

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
    return render(request, 'library/book_add.html', context)


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

    return render(request, 'library/book_info.html', context)


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

    return render(request, 'library/book_edit.html', context)


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

def signin(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    domain = request.POST.get("domain")
    remember = request.POST.get("remember")
    django_timezone = request.POST.get("django_timezone")
    p = Person.objects.filter(login=username, domain=domain, status=1)
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

def user_edit(request):
    context = isauth(request)
    return render(request, 'library/user_edit.html', context)
