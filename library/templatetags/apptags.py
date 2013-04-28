from django.template import Library
register = Library()

@register.filter(name='times')
def times(number):
    return range(number)

@register.filter(name='utimes')
def utimes(number):
    return range(5-number)