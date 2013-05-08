from django.db import models, connection
from django.db.models import Avg, Max
from django.utils import timezone


def searchPref(sew):
    return " where (isbn like upper('%%" + sew + \
           "%%') or upper(title) like upper('%%" + sew + \
           "%%') or upper(language) like upper('%%" + sew + \
           "%%') or upper(authors) like upper('%%" + sew + \
           "%%') or upper(language) like upper('%%" + sew + \
           "%%') or upper(keywords) like upper('%%" + sew + "%%'))"

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
    session = models.CharField(max_length=255, null=True)

    class Meta:
        unique_together = ("domain", "login")

    def __str__(self):
        return self.login

    def getPrintableName(self):
        return self.fname + " " + self.lname

    def getBooks(self, rot, sew, sot, soc, start, count):
        que = "select * from getPersonBooks(" + str(self.id) + ", '" + rot + "')"
        queSer = ''
        if sew != '':
            queSer = searchPref(sew)

        queSor = ' order by ' + soc
        if sot == 1:
            queSor += ' desc'

        cursor = connection.cursor()
        cursor.execute(que + queSer + queSor)
        rc = cursor.rowcount
        if rc > 0:
            cursor.scroll(start)
            bookslist = cursor.fetchmany(count)
        else:
            bookslist = []
        cursor.close()
        return bookslist, rc


class Author(models.Model):
    lname = models.CharField(max_length=255)
    fname = models.CharField(max_length=255)

    info = models.TextField(null=True)

    def getPrintName(self):
        return self.fname + " " + self.lname

    def getPrintNameSh(self):
        return self.fname + " " + self.lname[0:1] + "."

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
    rating = models.IntegerField()
    def getPrintAuthors(self):
        d = ", "
        authors = [a.getPrintName() for a in self.authors.all()]
        return d.join(authors)

    def getPrintAuthorsSh(self):
        d = ", "
        authors = [a.getPrintNameSh() for a in self.authors.all()]
        return d.join(authors)

    def getPrintKeywords(self):
        d = ", "
        keywords = [k.word for k in self.keywords.all()]
        return d.join(keywords)
        # image = models.ImageField

    def getAvgRating(self):
        return self.opinion_set.aggregate(Avg('rating'))['rating__avg']

    def getValues(self):
        return (
            self.isbn, self.ozon, self.title, self.language.language, self.getPrintAuthors(), self.getPrintKeywords(),
            self.getAvgRating(), self.bookitem_set.count())

    @staticmethod
    def getAllFormated(sew, sot, soc,start,count):
        que = "select * from allbooks"
        queSer = ''
        if sew != '':
            queSer = searchPref(sew)

        queSor = ' order by ' + soc
        if sot == 1:
            queSor += ' desc'

        cursor = connection.cursor()
        cursor.execute(que + queSer + queSor)
        rc = cursor.rowcount
        if rc > 0:
            cursor.scroll(start)
            bookslist = cursor.fetchmany(count)
        else:
            bookslist = []
        cursor.close()
        return bookslist, rc


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
                self.reader_id)


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


class SysSetting(models.Model):
    authType = models.IntegerField()
    transferCd = models.IntegerField()
    libname = models.CharField(max_length=255)