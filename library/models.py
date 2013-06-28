from django.db import models
from django.db.models import Q
from django.utils import timezone


# People

class Domain(models.Model):
    domain = models.CharField(max_length=255, primary_key=True)

    def __str__(self):
        return self.domain


class Person(models.Model):
    domain = models.ForeignKey(Domain)
    login = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    fname = models.CharField(max_length=255)
    lname = models.CharField(max_length=255)
    pwd = models.CharField(max_length=255)
    salt = models.CharField(max_length=255)
    adm = models.IntegerField(default=0)
    status = models.IntegerField(default=1)

    class Meta:
        unique_together = ("domain", "login")

    def __str__(self):
        return self.login

    def natural_key(self):
        return self.fname + " " + self.lname

    def getBigNaturalKey(self):
        return {"id":self.id,"name":self.natural_key()}


class PersonImage(models.Model):
    person = models.ForeignKey(Person)
    image = models.CharField(max_length=255)


class Author(models.Model):
    lname = models.CharField(max_length=255)
    fname = models.CharField(max_length=255)

    info = models.TextField(null=True)

    def __str__(self):
        return self.fname + " " + self.lname

    def getPrintName(self):
        return self.fname + " " + self.lname

    def natural_key(self):
        return (self.fname + " " + self.lname,)

    class Meta:
        unique_together = ("fname", "lname")
        index_together = [["fname", "lname"], ]


class Keyword(models.Model):
    word = models.CharField(max_length=255, primary_key=True)
    description = models.TextField(null=True)


class Language(models.Model):
    language = models.CharField(max_length=255, primary_key=True)


class Book(models.Model):
    isbn = models.CharField(max_length=255, primary_key=True)
    ozon = models.CharField(max_length=255, null=True)
    title = models.CharField(max_length=255)
    language = models.ForeignKey(Language)
    description = models.TextField()
    authors = models.ManyToManyField(Author)
    keywords = models.ManyToManyField(Keyword)
    image = models.CharField(max_length=255, null=True)
    rating = models.IntegerField(null=True)
    item_count = models.IntegerField(null=True)
    date=models.DateTimeField()
    def __str__(self):
        return self.isbn + " " + self.title


class BookItem(models.Model):
    book = models.ForeignKey(Book)
    owner = models.ForeignKey(Person, related_name="reading_items_set")
    reader = models.ForeignKey(Person, related_name="owning_items_set")
    value = models.IntegerField(default=1)
    rdate = models.DateTimeField(null=True)
    takedate = models.DateTimeField(null=True)
    status = models.IntegerField()

    def checkTake(self):
        ss = SysSetting.objects.latest('id')
        takeb = 0
        takep = ''
        if self.takedate:
            seconds = (timezone.now() - self.takedate).total_seconds()
            if seconds < ss.transferCd:
                takeb = 2
                takep = ss.transferCd - seconds
                return (takeb, takep)

        conv_count = self.conversation_set.all().count()
        if conv_count > 0:
            conv = self.conversation_set.latest('id')
            mess = conv.message_set.filter(isRead=0).exclude(Q(mtype=self.value)|Q(resp=2))
            if mess:
                takeb = 1
                takep = conv.personFrom.id
        return (takeb, takep)

    def getValues(self):
        (takeb, takep) = self.checkTake()
        return {"id":self.id,
                "value": self.value,
                "owner":self.owner.getBigNaturalKey(),
                "reader":self.reader.getBigNaturalKey(),
                "take":{"type":takeb,"info":takep},
                "status":self.status}

class ItemStatus(models.Model):
    item = models.ForeignKey(BookItem)
    status = models.IntegerField()
    date = models.DateTimeField(null=True)


class Opinion(models.Model):
    person = models.ForeignKey(Person)
    book = models.ForeignKey(Book)
    date = models.DateTimeField()
    rating = models.IntegerField()
    text = models.TextField()


class Link(models.Model):
    person = models.ForeignKey(Person)
    book = models.ForeignKey(Book)
    opinion = models.ForeignKey(Opinion, null=True)
    url = models.CharField(max_length=255)
    text = models.TextField()


class Conversation(models.Model):
    item = models.ForeignKey(BookItem)
    personFrom = models.ForeignKey(Person, related_name="requestfrom_set")
    personTo = models.ForeignKey(Person, related_name="requestto_set")


class Message(models.Model):
    conversation = models.ForeignKey(Conversation)
    date = models.DateTimeField()
    mtype = models.IntegerField()
    resp = models.IntegerField()
    comment = models.TextField(null=True)
    isRead = models.IntegerField(null=True)


class ReturnMessage(models.Model):
    personFrom = models.ForeignKey(Person, related_name="returnfrom_set")
    personTo = models.ForeignKey(Person, related_name="returnto_set")
    item = models.ForeignKey(BookItem)
    date = models.DateTimeField()
    isRead = models.IntegerField(null=True)


class SysSetting(models.Model):
    authType = models.IntegerField()
    transferCd = models.IntegerField()
    libname = models.CharField(max_length=255)
    system_address = models.CharField(max_length=255)
