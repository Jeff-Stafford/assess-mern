
# This file can be removed once production data imported into the new EOD system
# When you delete this file, make sure it's no longer in use in settings.py

class Default(object):

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'legacy':
            return 'eod_legacy_db'
        return None


    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'legacy':
            return 'eod_legacy_db'
        return None


    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'legacy':
            return False
        return None
