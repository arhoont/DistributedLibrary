import hashlib
import random
import string
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from library.models import PersonImage, Person, SysSetting
from django.template import Context


def cleanTmp(person):
    """
        remove all tmp-files associated with person
    """
    pis = PersonImage.objects.filter(person=person)
    for pi in pis:
        default_storage.delete(pi.image)
        pi.delete()


def isauth(request):
    """
        check authorization
    """
    context = Context()
    if request.session.get('person_id', False):
        person = Person.objects.get(pk=request.session["person_id"])
        context['person'] = person
    context['libname'] = SysSetting.objects.latest('id').libname
    return context

def registrRevers(context):
    if not context.has_key('person'):
        context["not_registred"]="yes"
        return True
    else:
        return False

def randstring(n):
    a = string.ascii_letters + string.digits
    return ''.join([random.choice(a) for i in range(n)])

def strHash(string):
    hash = hashlib.md5()
    hash.update(string.encode())
    return hash.hexdigest()

def sendEmail(title, text, text_css, recipients):
    mail_title = title

    text_content = text

    html_content = text_css
   
    email = "DLibr <do_not_replay@emc.com>"
    msg = EmailMultiAlternatives(mail_title, text_content, email, recipients)
    msg.attach_alternative(html_content, "text/html")

    try:
        msg.send()
        return True
    except BaseException as err:
        f=open('/home/muser/sites/log.txt','a')
        f.write(str(err)+'\n')
        f.close()
        return False
