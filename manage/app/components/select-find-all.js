import Component from '@ember/component';
import { computed } from '@ember/object';
import { isArray } from '@ember/array';
import { inject } from '@ember/service';
import { ComponentQueryManager } from 'ember-apollo-client';

import tagQuery from 'leads-manage/gql/queries/tag/dropdown';

export default Component.extend(ComponentQueryManager, {
  errorProcessor: inject('graph-errors'),

  closeOnSelect: true,
  allowClear: true,
  multiple: false,
  type: null,
  sortField: 'name',
  sortOrder: 1,
  selected: null,
  placeholder: null,
  disabled: false,

  _optionsPromise: null,

  _filteredOptionsPromise: computed('_optionsPromise', 'selected.[]', function() {
    const selected = this.get('selected') || [];
    const filterFrom = isArray(selected) ? selected : [selected];
    const promise = this.get('_optionsPromise');
    if (!promise) return promise;
    return promise.then(r => r.filter(i => filterFrom.filterBy('id', i.id).length === 0));
  }),

  loadOptions() {
    const { query, resultKey } = this.get('_query');

    const variables = {
      sort: { field: this.sortField, order: this.sortOrder },
      pagination: { first: 100 },
    };

    const promise = this.get('apollo').watchQuery({ query, variables }, resultKey)
      .then(r => r.map(i => i.node))
      .catch(e => this.get('errorProcessor').show(e));

    this.set('_optionsPromise', promise);
  },

  _query: computed('type', function() {
    const type = this.get('type');
    switch (type) {
      case 'tag':
        return { query: tagQuery, resultKey: 'allTags.edges' };
    }
    this.get('errorProcessor').show(new Error(`The model type ${type} is not supported.`));
  }),
});
