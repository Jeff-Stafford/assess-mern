import logging

logger = logging.getLogger('django')

EODDB_APPS = ['eod', 'django_celery_results', 'django_celery_beat',]

class RouterLogger(object):

    def __init__(self, name='router'):
        # print("Initialize ", name)
        self.name = name
        self.debug = False

    def db_for_read(self, *args, **kwargs):
        if self.debug:
            print("------> [", self.name, "] db_for_read args=", *args, "kwargs=", dict(**kwargs))
        r = self._db_for_read(*args, **kwargs)
        if self.debug:
            print("     => [", self.name, "]", r)
        return r


    def db_for_write(self, *args, **kwargs):
        if self.debug:
            print("------>  [", self.name, "] db_for_write args=", *args, "kwargs=", dict(**kwargs))
        r = self._db_for_write(*args, **kwargs)
        if self.debug:
            print("     => [", self.name, "]", r)
        return r


    def allow_relation(self, *args, **kwargs):
        if self.debug:
            print("------> [", self.name, "] allow_relation args=", *args, "kwargs=", dict(**kwargs))
        r = self._allow_relation(*args, **kwargs)
        if self.debug:
            print("     => [", self.name, "]", r)
        return r


    def allow_migrate(self, *args, **kwargs):
        if self.debug:
            print("------> [", self.name, "] allow_migrate args=", *args, "kwargs=", dict(**kwargs))
        r = self._allow_migrate(*args, **kwargs)
        if self.debug:
            print("     => [", self.name, "]", r)
        return r


class GISRouter(RouterLogger):
    """
    A router to control all database operations on models in the gis application.
    """

    def __init__(self, *args, **kwargs):
        super(GISRouter, self).__init__('GIS')


    def _db_for_read(self, model, **hints):
        if model._meta.app_label == 'electiongis':
            return 'gisdb'
        return None

    def _db_for_write(self, model, **hints):
        if model._meta.app_label == 'electiongis':
            return 'gisdb'
        return None

    def _allow_relation(self, obj1, obj2, **hints):
        if obj1._meta.app_label == 'electiongis' or \
           obj2._meta.app_label == 'electiongis':
           return True
        return None

    def _allow_migrate(self, db, app_label, model=None, **hints):
        if app_label == 'electiongis':
            return db == 'gisdb'
        return None


class APIDBRouter(RouterLogger):

    """
    A router to control all database operations on models in the EOD application.
    """

    def __init__(self, *args, **kwargs):
        super(APIDBRouter, self).__init__('EOD')


    def _db_for_read(self, model, **hints):
        if model and model._meta:
            if model._meta.app_label in EODDB_APPS:
                return 'election_manager_eod'
            elif model._meta.app_label == 'electiongis':
                return 'election_manager_gis'
            else:
                return 'election_manager'
        return None

    def _db_for_write(self, model, **hints):
        if model and model._meta:
            if model._meta.app_label in EODDB_APPS:
                return 'election_manager_eod'
            elif model._meta.app_label == 'electiongis':
                return 'election_manager_gis'
            else:
                return 'election_manager'

        return None

    def _allow_relation(self, obj1, obj2, **hints):
        if (obj1 and obj1._meta and obj1._meta.app_label in EODDB_APPS) or \
           (obj2 and obj2._meta and obj2._meta.app_label in EODDB_APPS):
           return True
        return None

    def _allow_migrate(self, db, app_label, model=None, **hints):
        if app_label in EODDB_APPS:
            return db == 'election_manager_eod'
        elif app_label == 'electiongis':
            return db == 'election_manager_gis'
        else:
            return db =='election_manager'

        return None


class APITestDBRouter(RouterLogger):

    """
    A router to control all database operations on models in the EOD application.
    """

    def __init__(self, *args, **kwargs):
        super(APIDBRouter, self).__init__('EOD')


    def _db_for_read(self, model, **hints):
        if model and model._meta:
            if model._meta.app_label in EODDB_APPS:
                return 'test_election_manager_eod'
            elif model._meta.app_label == 'electiongis':
                return 'test_election_manager_gis'
            else:
                return 'test_election_manager'
        return None

    def _db_for_write(self, model, **hints):
        if model and model._meta:
            if model._meta.app_label in EODDB_APPS:
                return 'test_election_manager_eod'
            elif model._meta.app_label == 'electiongis':
                return 'test_election_manager_gis'
            else:
                return 'test_election_manager'

        return None

    def _allow_relation(self, obj1, obj2, **hints):
        if (obj1 and obj1._meta and obj1._meta.app_label in EODDB_APPS) or \
           (obj2 and obj2._meta and obj2._meta.app_label in EODDB_APPS):
           return True
        return None

    def _allow_migrate(self, db, app_label, model=None, **hints):
        if app_label in EODDB_APPS:
            return db == 'test_election_manager_eod'
        elif app_label == 'electiongis':
            return db == 'test_election_manager_gis'
        else:
            return db =='test_election_manager'

        return None

