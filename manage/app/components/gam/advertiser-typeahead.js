import Component from '@ember/component';
import { isArray } from '@ember/array';
import { inject } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import { ComponentQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/gam/advertiser/typeahead';

export default Component.extend(ComponentQueryManager, {
  errorProcessor: inject('graph-errors'),

  closeOnSelect: true,
  allowClear: true,
  multiple: false,
  timeout: 600,
  selected: null,
  placeholder: null,
  disabled: false,


  search: task(function* (phrase) {
    const variables = { phrase };
    const selected = this.get('selected') || [];
    const filterFrom = isArray(selected) ? selected : [selected];
    yield timeout(this.get('timeout'));

    return this.get('apollo').watchQuery({ query, variables }, 'listGAMAdvertisers.nodes')
      .then((nodes) => nodes.filter((node) => filterFrom.filterBy('id', node.id).length === 0))
      .catch((e) => this.get('errorProcessor').show(e))
    ;
  }),
});
