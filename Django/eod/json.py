import json

from phonenumber_field.phonenumber import PhoneNumber
# from phonenumber_field.modelfields import PhoneNumberField

from eod import models

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, models.Officer):
            return o.pk
        elif isinstance(o, PhoneNumber):
            return o.as_national

        return json.JSONEncoder.default(self, o)
