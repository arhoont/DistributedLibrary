from django.db import models
from django.db.models import Avg

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

# no!
# class Email(models.Model):
#     person = models.ForeignKey(Person)
#     email = models.CharField(max_length=255, primary_key=True)


#Book
class Author(models.Model):
    fname = models.CharField(max_length=255)
    lname = models.CharField(max_length=255)
    info = models.TextField(null=True)

    def getPrintName(self):
        return self.fname + " " + self.lname

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
    def getPrintAuthors(self):
        d=", "
        authors=[a.getPrintName() for a in self.authors.all()]
        return d.join(authors)
    def getPrintKeywords(self):
        d=", "
        keywords=[k.word for k in self.keywords.all()]
        return d.join(keywords)
        # image = models.ImageField
    def getAvgRating(self):
        return self.opinion_set.aggregate(Avg('rating'))['rating__avg']
    def getValues(self):
        return (self.isbn,self.ozon,self.title,self.language.language,self.getPrintAuthors(),self.getPrintKeywords(), self.getAvgRating())

class BookItem(models.Model):
    isbn=models.ForeignKey(Book)
    owner=models.ForeignKey(Person, related_name="itemowner")
    reader=models.ForeignKey(Person, related_name="itemreader")
    value = models.IntegerField(default=1)
    rdate = models.DateTimeField(null=True)

class ItemStatus(models.Model):
    item=models.ForeignKey(BookItem)
    status = models.IntegerField()
    date = models.DateTimeField(null=True)

# Opinion and Link
class Opinion(models.Model):
    person=models.ForeignKey(Person)
    isbn=models.ForeignKey(Book)
    date = models.DateTimeField()
    rating = models.IntegerField()
    text = models.TextField()

class Link(models.Model):
    person=models.ForeignKey(Person)
    isbn=models.ForeignKey(Book)
    opinion = models.ForeignKey(Opinion, null=True)
    url = models.CharField(max_length=255)
    text = models.TextField()

class Request(models.Model):
    item=models.ForeignKey(BookItem)
    personFrom=models.ForeignKey(Person, related_name="requestfrom")
    personTo=models.ForeignKey(Person, related_name="requestto")
    dateSend = models.DateTimeField()
    dateReply = models.DateTimeField(null=True)
    answer= models.IntegerField(null=True)
    comment = models.TextField(null=True)
    isRead = models.IntegerField(null=True)

class SysSetting(models.Model):
    authType = models.IntegerField()
    transferCd = models.IntegerField()