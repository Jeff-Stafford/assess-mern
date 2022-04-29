import xlwt

from eod import models


class Column(object):

    def __init__(self, path, label=None):
        self._path = path
        self._label = label

    @property
    def path(self):
        return self._path

    @property
    def label(self):
        label = self.path
        if self._label:
            label = self._label
        return label

    def collection_label(self, collection_name, idx):
        return '%s.%d.%s' % (collection_name, idx, self.label)


class Exporter(object):

    def __init__(self, state_id, progress_callback=None):
        self._state_id = state_id
        self._wb = xlwt.Workbook()
        self._ws = None
        self._colum_created = {}
        self._last_column = 0
        self._progress_callback = progress_callback


    def run(self):
        if self._state_id:
            state = models.State.objects.get(pk=self._state_id)
            local_officials = models.LocalOfficial.objects.filter(region__state__pk=self._state_id).all()
            self.export_state(state, local_officials, progress_callback=self._progress_callback)
        else:
            states = models.State.objects.all()
            total_states = len(states)

            for i, state in enumerate(states):
                if self._progress_callback:
                    self._progress_callback(i, total_states)

                local_officials = models.LocalOfficial.objects.filter(region__state__pk=state.id).all()
                self.export_state(state, local_officials)

            if self._progress_callback:
                self._progress_callback(total_states, total_states)


    def export_state(self, state, local_officials, progress_callback=None):
        import time

        self._ws = self._wb.add_sheet(state.name)
        self._ws.set_portrait(False)
        self._ws.set_fit_num_pages(1)

        columns = [
            Column(path='id'),
            Column(path='region.name', label='region'),
            Column(path='region.county.county_type'),
            Column(path='region.county.name'),
            Column(path='region.municipality.municipality_type'),
            Column(path='region.municipality.name'),
            Column(path='hours'),
            Column(path='further_instruction'),
            Column(path='last_updated'),
            Column(path='geoid'),
            Column(path='type')
        ]

        officer_columns = [
            Column(path='office_name'),
            Column(path='first_name'),
            Column(path='last_name'),
            Column(path='phone'),
            Column(path='fax'),
            Column(path='email'),
        ]

        address_columns = [
            Column(path='address_to'),
            Column(path='street1'),
            Column(path='street2'),
            Column(path='city'),
            Column(path='zip'),
            Column(path='zip4'),
            Column(path='is_physical'),
            Column(path='is_regular_mail'),
            Column(path='main_email'),
            Column(path='main_phone_number'),
            Column(path='main_fax_number'),
            Column(path='functions'),
            Column(path='primary_contact.office_name'),
        ]

        start_row = 1
        self._export_columns(columns)

        total = len(local_officials) * 2
        current = 0

        for row, official in enumerate(local_officials):
            if progress_callback:
                progress_callback(current, total)
                current += 1

            for col, column in enumerate(columns):
                value = self._get_value(official, column.path)
                self._ws.write_merge(start_row + row, start_row + row, col, col, value)
            self._export_objects(row, col, officer_columns, official, 'officers', calc_last_column=True)


        for row, official in enumerate(local_officials):
            if progress_callback:
                progress_callback(current, total)
                current += 1

            self._export_objects(row, self._last_column, address_columns, official, 'addresses')

        # notify about final step
        if progress_callback:
            progress_callback(total, total)

        # cleanup
        self._colum_created = {}
        self._last_column = 0


    def _export_columns(self, columns):
        for i, col in enumerate(columns):
            self._ws.write_merge(0, 0, i, i, col.label)


    def _export_objects(self, current_row, last_column, columns, parent, children_field, calc_last_column=False):
        children = getattr(parent, children_field)
        if not hasattr(children, 'all'):
            return

        current_row += 1

        for i, obj in enumerate(children.all()):
            for col, column in enumerate(columns):
                start_col = last_column + 1 + (i * len(columns))

                label = column.collection_label(children_field, i + 1)
                if not self._colum_created.setdefault(label, False):
                    self._ws.write_merge(0, 0, start_col + col, start_col + col, label)
                    self._colum_created[label] = True

                value = self._get_value(obj, column.path)
                self._ws.write_merge(current_row, current_row, start_col + col, start_col + col, value)

                if calc_last_column:
                    self._last_column = max(self._last_column, start_col + col)



    def _get_value(self, root, path):
        value = ''
        if path == "last_updated":
            root = root.last_updated()
        else:
            for part in path.split('.'):
                if hasattr(root, part):
                    root = getattr(root, part)
                else:
                    root = None
                    break

        if root:
            value = str(root)

        return value


    def save(self, stream):
        self._wb.save(stream)
