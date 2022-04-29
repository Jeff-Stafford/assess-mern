from django import forms
from django.db.models import Q

import django_filters

from manager import consts, models

from eod.forms import SearchForm


def _create_elections_filter(query):
    if not query:
        return Q()

    filters = Q(title__icontains=query)
    q = query.lower()
    for state in consts.STATES:
        state_geoid, accr, name = state
        if not state_geoid:
            continue
        if q in accr.lower() or q in name.lower():
            filters |= Q(state_geoid=state_geoid.zfill(2))
    return filters


class ElectionFilter(django_filters.FilterSet):

    election_status = django_filters.MultipleChoiceFilter(choices=consts.FILTER_ELECTION_STATUSES,
        widget=forms.CheckboxSelectMultiple)

    election_level = django_filters.ModelMultipleChoiceFilter(queryset=models.ElectionLevel.objects.all(),
        widget=forms.CheckboxSelectMultiple)

    election_type = django_filters.ModelMultipleChoiceFilter(queryset=models.ElectionType.objects.all(),
        widget=forms.CheckboxSelectMultiple)

    class Meta:
        model = models.Election
        fields = ['election_status', 'election_type', 'election_level',]

    # @property
    # def qs(self):
    #     queryset = super().qs
    #     if self.request is None:
    #         return queryset

    #     search_form = SearchForm(self.request.GET or None)
    #     query = None
    #     if search_form.is_valid():
    #         query = search_form['query'].value()
    #     if not query:
    #         return queryset


    #     filters = _create_elections_filter(query)
    #     user = getattr(self.request, 'user', None)
    #     if user and not user.has_perm('manager.view_all_election'):
    #         filters &= Q(user=user)

    #     return queryset.filter(filters)