from __future__ import unicode_literals

from django.core.cache import cache
from django.contrib.gis.db import models

from electiongis import consts


class State(models.Model):
    # geom = models.MultiPolygonField()
    statens = models.TextField(db_column='STATENS', blank=True, null=True)  # Field name made lowercase.
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    geo_id2 = models.TextField(db_column='geo_id2', blank=True, null=True) # Field added for LEAP data.
    fips = models.TextField(db_column='fips', blank=True, null=True) # Field added for LEAP data.
    stusps = models.TextField(db_column='STUSPS', blank=True, null=True)  # Field name made lowercase.
    name = models.TextField(db_column='NAME', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'state'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name


class County(models.Model):
    # geom = models.MultiPolygonField()
    countyns = models.TextField(db_column='COUNTYNS', blank=True, null=True)  # Field name made lowercase.
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    geo_id2 = models.TextField(db_column='geo_id2', blank=True, null=True) # Field added for LEAP data.
    fips = models.TextField(db_column='fips', blank=True, null=True) # Field added for LEAP data.
    namelsad = models.TextField(db_column='NAMELSAD', blank=True, null=True)  # Field name made lowercase.
    classfp = models.TextField(db_column='CLASSFP', blank=True, null=True)  # Field name made lowercase.
    funcstat = models.TextField(db_column='FUNCSTAT', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.
    county_id = models.CharField(max_length=3, db_index=True, db_column='county_id', blank=False, null=False)  # Field name made lowercase.


    class Meta:
        managed = False
        db_table = 'county'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.namelsad

    def __unicode__(self):
        return self.namelsad


class CountySubdivision(models.Model):
    # geom = models.MultiPolygonField()
    cousubns = models.TextField(db_column='COUSUBNS', blank=True, null=True)  # Field name made lowercase.
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    namelsad = models.TextField(db_column='NAMELSAD', blank=True, null=True)  # Field name made lowercase.
    classfp = models.TextField(db_column='CLASSFP', blank=True, null=True)  # Field name made lowercase.
    funcstat = models.TextField(db_column='FUNCSTAT', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.
    county_id = models.CharField(max_length=3, db_index=True, db_column='county_id', blank=False, null=False)  # Field name made lowercase.


    class Meta:
        managed = False
        db_table = 'county_subdivision'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.namelsad

    def __unicode__(self):
        return self.namelsad


class Place(models.Model):
    name = models.TextField(db_column='name', blank=True, null=True)
    fips = models.TextField(db_column='fips', blank=True, null=True)
    geo_id2 = models.TextField(db_column='geo_id2', blank=True, null=True)
    type = models.TextField(db_column='type', blank=True, null=True)

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)
    county_id = models.CharField(max_length=3, db_index=True, db_column='county_id', blank=False, null=False)
    place_id = models.CharField(max_length=5, db_index=True, db_column='place_id', blank=False, null=True)

    class Meta:
        managed = False
        db_table = 'place'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name


class CongressionalDistrict114Th(models.Model):
    # geom = models.MultiPolygonField()
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    namelsad = models.TextField(db_column='NAMELSAD', blank=True, null=True)  # Field name made lowercase.
    cdsessn = models.IntegerField(db_column='CDSESSN', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'congressional_district_114th'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.namelsad

    def __unicode__(self):
        return self.namelsad


class SchoolDistrictElementary(models.Model):
    # geom = models.MultiPolygonField()
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    name = models.TextField(db_column='NAME', blank=True, null=True)  # Field name made lowercase.
    lograde = models.TextField(db_column='LOGRADE', blank=True, null=True)  # Field name made lowercase.
    higrade = models.TextField(db_column='HIGRADE', blank=True, null=True)  # Field name made lowercase.
    sdtyp = models.TextField(db_column='SDTYP', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'school_district_elementary'
        default_permissions = ('add', 'change', 'delete', 'view')


class SchoolDistrictSecondary(models.Model):
    # geom = models.MultiPolygonField()
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    name = models.TextField(db_column='NAME', blank=True, null=True)  # Field name made lowercase.
    lograde = models.TextField(db_column='LOGRADE', blank=True, null=True)  # Field name made lowercase.
    higrade = models.TextField(db_column='HIGRADE', blank=True, null=True)  # Field name made lowercase.
    sdtyp = models.TextField(db_column='SDTYP', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'school_district_secondary'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name


class SchoolDistrictUnified(models.Model):
    # geom = models.MultiPolygonField()
    geoid = models.TextField(db_column='GEOID', blank=True, null=True)  # Field name made lowercase.
    name = models.TextField(db_column='NAME', blank=True, null=True)  # Field name made lowercase.
    lograde = models.TextField(db_column='LOGRADE', blank=True, null=True)  # Field name made lowercase.
    higrade = models.TextField(db_column='HIGRADE', blank=True, null=True)  # Field name made lowercase.
    sdtyp = models.TextField(db_column='SDTYP', blank=True, null=True)  # Field name made lowercase.
    aland = models.FloatField(db_column='ALAND', blank=True, null=True)  # Field name made lowercase.
    awater = models.FloatField(db_column='AWATER', blank=True, null=True)  # Field name made lowercase.
    intptlat = models.TextField(db_column='INTPTLAT', blank=True, null=True)  # Field name made lowercase.
    intptlon = models.TextField(db_column='INTPTLON', blank=True, null=True)  # Field name made lowercase.

    state_id = models.CharField(max_length=2, db_index=True, db_column='state_id', blank=False, null=False)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'school_district_unified'
        default_permissions = ('add', 'change', 'delete', 'view')

    def __str__(self):
        return self.name

    def __unicode__(self):
        return self.name


# class SchoolDistrict(models.Model):
#     id = models.TextField()
#     name = models.TextField()
#     type = models.CharField(max_length=10, choices=(('elementary', 'elementary'), ('secondary', 'secondary'), ('unified', 'unified')))

#     class Meta:
#         managed = False


def _collect_all_state_locations(state_id):
    cache_key = '_collect_all_state_locations|%s|' % state_id

    all_state_locations = cache.get(cache_key)
    if all_state_locations is None:
        state = State.objects.get(state_id=state_id)
        all_state_locations = dict(state=[], counties=[], subCounties=[], schoolElementary=[], schoolSecondary=[], schoolUnified=[], congressionalDistrict=[])
        all_state_locations['state'] = dict(id=consts.LOCATION_TYPE_STATE+'.'+state.geoid, state_id=state.state_id, name=state.name)
        all_state_locations['counties'] = [dict(id=consts.LOCATION_TYPE_COUNTY+'.'+c.geoid, name=c.namelsad, county_id=c.county_id) for c in County.objects.filter(state_id=state_id).order_by('namelsad').all()]
        all_state_locations['subCounties'] = [dict(id=consts.LOCATION_TYPE_COUNTY_SUBDIVISION+'.'+sc.geoid, name=sc.namelsad, county_id=sc.county_id) for sc in CountySubdivision.objects.filter(state_id=state_id).order_by('namelsad').all()]
        all_state_locations['schoolElementary'] = [dict(id=consts.LOCATION_TYPE_SCHOOL_DISTRICT_ELEMENTARY+'.'+se.geoid, name=se.name) for se in SchoolDistrictElementary.objects.filter(state_id=state_id).order_by('name').all()]
        all_state_locations['schoolSecondary'] = [dict(id=consts.LOCATION_TYPE_SCHOOL_DISTRICT_SECONDARY+'.'+ss.geoid, name=ss.name) for ss in SchoolDistrictSecondary.objects.filter(state_id=state_id).order_by('name').all()]
        all_state_locations['schoolUnified'] = [dict(id=consts.LOCATION_TYPE_SCHOOL_DISTRICT_UNIFIED+'.'+su.geoid, name=su.name) for su in SchoolDistrictUnified.objects.filter(state_id=state_id).order_by('name').all()]
        all_state_locations['congressionalDistrict'] = [dict(id=consts.LOCATION_TYPE_CONGRESSIONAL_DISTRICT_114TH+'.'+cd.geoid, name=cd.namelsad) for cd in CongressionalDistrict114Th.objects.filter(state_id=state_id).order_by('namelsad').all()]
        cache.set(cache_key, all_state_locations, 60 * 60 * 24)  # 60s*60m*24 == 1d

    return all_state_locations


def get_all_locations_as_choices(state_id):
    cache_key = 'get_all_locations_as_choices|%s|' % state_id

    all_locations_as_choices = cache.get(cache_key)
    if all_locations_as_choices is None:
        all_state_locations = _collect_all_state_locations(state_id)
        all_locations_as_choices = list()

        for c in all_state_locations['counties']:
            all_locations_as_choices.append((c['id'], c['name'],))
            for sc in all_state_locations['subCounties']:
                if c['county_id'] == sc['county_id']:
                    all_locations_as_choices.append((sc['id'], "%s / %s" % (c['name'], sc['name']),))

        all_locations_as_choices += [(se['id'], se['name'],) for se in all_state_locations['schoolElementary']]
        all_locations_as_choices += [(ss['id'], ss['name'],) for ss in all_state_locations['schoolSecondary']]
        all_locations_as_choices += [(su['id'], su['name'],) for su in all_state_locations['schoolUnified']]
        all_locations_as_choices += [(cd['id'], cd['name'],) for cd in all_state_locations['congressionalDistrict']]
        cache.set(cache_key, all_locations_as_choices, 60 * 60 * 24)  # 1d
    return all_locations_as_choices


def get_all_locations(state_id, term=None):
    all_state_locations = _collect_all_state_locations(state_id)
    state = all_state_locations['state']

    if term:
        term = term.lower()

    cache_key = 'get_all_locations|%s|%s|' % (state_id, term)

    results = cache.get(cache_key)
    if results is None:
        results = list()

        children = list()
        if term:
            for c in all_state_locations['counties']:
                subChildren = list()
                for sc in all_state_locations['subCounties']:
                    if c['county_id'] == sc['county_id'] and term in sc['name'].lower():
                        subChildren.append(dict(id=sc['id'], text="%s / %s" % (c['name'], sc['name'])))
                if term in c['name'].lower():
                    children.append(dict(id=c['id'], text=c['name']))
                if subChildren:
                    children = children + subChildren
        else:
            for c in all_state_locations['counties']:
                children.append(dict(id=c['id'], text=c['name']))
                for sc in all_state_locations['subCounties']:
                    if c['county_id'] == sc['county_id']:
                        children.append(dict(id=sc['id'], text="%s / %s" % (c['name'], sc['name'])))

        if children:
            results.append(dict(text="%s Counties & Subcounties" % state['name'], children=children))

        children = [dict(id=se['id'], text=se['name']) for se in all_state_locations['schoolElementary'] if term is None or term in se['name'].lower()]
        if children:
            results.append(dict(text="%s Elementary School Districts" % state['name'], children=children))

        children = [dict(id=ss['id'], text=ss['name']) for ss in all_state_locations['schoolSecondary'] if term is None or term in ss['name'].lower()]
        if children:
            results.append(dict(text="%s Secondary School Districts" % state['name'], children=children))

        children = [dict(id=su['id'], text=su['name']) for su in all_state_locations['schoolUnified'] if term is None or term in su['name'].lower()]
        if children:
            results.append(dict(text="%s Unified School Districts" % state['name'], children=children))

        children = [dict(id=cd['id'], text=cd['name']) for cd in all_state_locations['congressionalDistrict'] if term is None or term in cd['name'].lower()]
        if children:
            results.append(dict(text="%s Congressional Districts" % state['name'], children=children))

        cache.set(cache_key, results, 60 * 5)  # cache 5 mins

    response=dict(err='nil', results=results)

    return response
