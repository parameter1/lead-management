import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import query from 'leads-manage/gql/queries/form/for-customer';

export default Component.extend({
  apollo: inject(),
  graphErrors: inject(),

  classNames: ['form-group'],

  customerId: null, // required;

  options: computed('customerId', async function() {
    const variables = { customerId: this.get('customerId') };
    try {
      const { edges } = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'allForms');
      return  edges.map(edge => edge.node);
    } catch(e) {
      this.get('graphErrors').show(e);
    }
  }),
});
