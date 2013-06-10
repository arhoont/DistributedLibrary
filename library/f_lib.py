import hashlib
import random
import string
from django.core.files.storage import default_storage
from library.models import PersonImage, Person, SysSetting
from django.template import Context
from django.db import connection

def cleanTmp(person):
    pis = PersonImage.objects.filter(person=person)
    for pi in pis:
        default_storage.delete(pi.image)
        pi.delete()


def isauth(request):
    context = Context()
    if request.session.get('person_id', False):
        person=Person.objects.get(pk=request.session["person_id"])
        context['person'] = person
    context['libname'] = SysSetting.objects.latest('id').libname
    return context


def randstring(n):
    a = string.ascii_letters + string.digits
    return ''.join([random.choice(a) for i in range(n)])


def strHash(string):
    hash = hashlib.md5()
    hash.update(string.encode())
    return hash.hexdigest()
