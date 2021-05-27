import Component from '@ember/component';
import { isArray } from '@ember/array';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { ComponentQueryManager } from 'ember-apollo-client';

import customerQuery from 'leads-manage/gql/queries/customer/search';
import emailCategoryQuery from 'leads-manage/gql/queries/email-category/search';
import userQuery from 'leads-manage/gql/queries/user/search';
import tagQuery from 'leads-manage/gql/queries/tag/search';

export default Component.extend(ComponentQueryManager, {
  errorProcessor: inject('graph-errors'),

  closeOnSelect: true,
  allowClear: true,
  multiple: false,
  timeout: 600,
  type: null,
  field: 'name',
  selected: null,
  placeholder: null,
  disabled: false,

  _query: computed('type', function() {
    const type = this.get('type');
    switch (type) {
      case 'customer':
        return { query: customerQuery, resultKey: 'searchCustomers.edges' };
      case 'tag':
        return { query: tagQuery, resultKey: 'searchTags.edges' };
      case 'user':
        return { query: userQuery, resultKey: 'searchUsers.edges' };
      case 'email-category':
        return { query: emailCategoryQuery, resultKey: 'searchEmailCategories.edges' };
    }
    this.get('errorProcessor').show(new Error(`The model type ${type} is not searchable.`));
  }),

  _pagination: computed('type', 'term', 'page', function() {
    // @todo this should actually be paginated, probably
    return { first: 20 };
  }),

  search: task(function* (phrase) {
    const pagination = this.get('_pagination');
    const field = this.get('field');

    const search = { field, phrase };
    const options = { position: 'contains' };
    const variables = { pagination, search, options };

    const { query, resultKey } = this.get('_query');
    const selected = this.get('selected') || [];
    const filterFrom = isArray(selected) ? selected : [ selected ];
    yield timeout(this.get('timeout'));
    return this.get('apollo').watchQuery({ query, variables }, resultKey)
      .then(r => r.map(i => i.node))
      .then(r => r.filter(i => filterFrom.filterBy('id', i.id).length === 0))
      .catch(e => this.get('errorProcessor').show(e))
    ;
  }),
});
