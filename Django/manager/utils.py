import urllib

from django.core.exceptions import ValidationError
from django import forms
from django.core.urlresolvers import reverse

from manager import models
from electiongis import consts as gconsts
from electiongis import models as gismodels

class OptionalChoiceWidget(forms.MultiWidget):
    def decompress(self,value):
        #this might need to be tweaked if the name of a choice != value of a choice
        if value: #indicates we have a updating object versus new one
            if value in [x[0] for x in self.widgets[0].choices]:
                 return [value,""] # make it set the pulldown to choice
            else:
                 return ["",value] # keep pulldown to blank, set freetext
        return ["",""] # default for new object

class OptionalChoiceField(forms.MultiValueField):
    def __init__(self, choices, max_length=80, *args, **kwargs):
        """ sets the two fields as not required but will enforce that (at least) one is set in compress """
        fields = (forms.ChoiceField(choices=choices,required=False),
                  forms.CharField(required=False))
        self.widget = OptionalChoiceWidget(widgets=[f.widget for f in fields])
        super(OptionalChoiceField,self).__init__(required=False,fields=fields,*args,**kwargs)
    def compress(self,data_list):
        """ return the choicefield value if selected or charfield value (if both empty, will throw exception """
        if not data_list:
            raise ValidationError('Need to select choice or enter text for this field')
        return data_list[0] or data_list[1]

def build_url(*args, **kwargs):
    get = kwargs.pop('get', {})
    url = reverse(*args, **kwargs)
    if get:
        url += '?' + urllib.parse.urlencode(get)
    return url


# save all locations
def save_locations(election, location):
    for loc in location:
        l = models.Location(election=election)
        location_type = 0

        location_type, geoid = loc.split('.')
        if location_type == gconsts.LOCATION_TYPE_STATE:
            state = gismodels.State.objects.get(state_id=welcome['state'])
            l.geoid=state.geoid
            l.name=state.name

        elif location_type == gconsts.LOCATION_TYPE_COUNTY:
            county = gismodels.County.objects.get(geoid=geoid)
            l.geoid = county.geoid
            l.name = county.namelsad

        elif location_type == gconsts.LOCATION_TYPE_COUNTY_SUBDIVISION:
            subdivision = gismodels.CountySubdivision.objects.get(geoid=geoid)
            l.geoid = subdivision.geoid
            l.name = subdivision.namelsad

        elif location_type == gconsts.LOCATION_TYPE_SCHOOL_DISTRICT_ELEMENTARY:
            school = gismodels.SchoolDistrictElementary.objects.get(geoid=geoid)
            l.geoid = school.geoid
            l.name = school.name

        elif location_type == gconsts.LOCATION_TYPE_SCHOOL_DISTRICT_SECONDARY:
            school = gismodels.SchoolDistrictSecondary.objects.get(geoid=geoid)
            l.geoid = school.geoid
            l.name = school.name

        elif location_type == gconsts.LOCATION_TYPE_SCHOOL_DISTRICT_UNIFIED:
            school = gismodels.SchoolDistrictUnified.objects.get(geoid=geoid)
            l.geoid = school.geoid
            l.name = school.name

        elif location_type == gconsts.LOCATION_TYPE_CONGRESSIONAL_DISTRICT_114TH:
            cd = gismodels.CongressionalDistrict114Th.objects.get(geoid=geoid)
            l.geoid = cd.geoid
            l.name = cd.namelsad

        l.location_type=location_type
        l.save()

