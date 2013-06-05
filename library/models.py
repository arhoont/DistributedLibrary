from django.db import models, connection
from django.db.models import Avg, Max
from django.utils import timezone


# People

class Domain(models.Model):
    domain = models.CharField(max_length=255, primary_key=True)

    def __str__(self):
        return self.domain


class Person(models.Model):
    domain = models.ForeignKey(Domain)
    login = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    fname = models.CharField(max_length=255)
    lname = models.CharField(max_length=255)
    pwd = models.CharField(max_length=255)
    salt = models.CharField(max_length=255)
    adm = models.IntegerField(default=0)
    status = models.IntegerField(default=1)

    def natural_key(self):
        return self.fname + " " + self.lname

    class Meta:
        unique_together = ("domain", "login")

    def __str__(self):
        return self.login

    def getPrintableName(self):
        return self.fname + " " + self.lname

class PersonImage(models.Model):
    person = models.ForeignKey(Person)
    image=models.CharField(max_length=255)

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
    # image = models.ImageField(upload_to='books')
    language = models.ForeignKey(Language)
    description = models.TextField()
    authors = models.ManyToManyField(Author)
    keywords = models.ManyToManyField(Keyword)
    image=models.CharField(max_length=255, null=True)
    rating = models.IntegerField(null=True)
    item_count = models.IntegerField(null=True)

    def __str__(self):
        return self.isbn+" "+self.title



class BookItem(models.Model):
    book = models.ForeignKey(Book)
    owner = models.ForeignKey(Person, related_name="reading_items_set")
    reader = models.ForeignKey(Person, related_name="owning_items_set")
    value = models.IntegerField(default=1)
    rdate = models.DateTimeField(null=True)
    takedate = models.DateTimeField(null=True)

    def changeReader(self, person):
        self.reader = person
        self.takedate = timezone.now()
        self.save()

    def checkTake(self):
        ss = SysSetting.objects.latest('id')
        takeb = 0
        takep = ''
        conv_count = self.conversation_set.all().count()
        if self.takedate:
            seconds = (timezone.now() - self.takedate).total_seconds()
            if seconds < ss.transferCd:
                takeb = 2
                takep = ss.transferCd - seconds
        if takeb==0 and conv_count > 0:
            conv = self.conversation_set.latest('id')
            mess = conv.message_set.filter(isRead=0)
            if mess:
                takeb = 1
                takep = conv.personFrom.id
        return (takeb, takep)

    def getValues(self):
        (takeb, takep) = self.checkTake()
        return (self.book.isbn,
                self.id,
                self.owner.fname+" "+self.owner.lname,
                self.reader.fname+" "+self.reader.lname,
                self.value,
                takeb,
                takep,
                self.reader_id,
                self.owner_id)

class ItemStatus(models.Model):
    item = models.ForeignKey(BookItem)
    status = models.IntegerField()
    date = models.DateTimeField(null=True)

# Opinion and Link
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
    personFrom = models.ForeignKey(Person, related_name="requestfrom")
    personTo = models.ForeignKey(Person, related_name="requestto")


class Message(models.Model):
    conversation = models.ForeignKey(Conversation)
    date = models.DateTimeField()
    mtype = models.IntegerField()
    resp = models.IntegerField()
    comment = models.TextField(null=True)
    isRead = models.IntegerField(null=True)

class ReturnMessage(models.Model):
    personFrom = models.ForeignKey(Person, related_name="returnfrom")
    personTo = models.ForeignKey(Person, related_name="returnto")
    item = models.ForeignKey(BookItem)
    date = models.DateTimeField()
    isRead = models.IntegerField(null=True)

class SysSetting(models.Model):
    authType = models.IntegerField()
    transferCd = models.IntegerField()
    libname = models.CharField(max_length=255)
