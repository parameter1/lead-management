import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/lead-report/forms';

export default Route.extend(RouteQueryManager, {
  /**
   *
   * @param {object} params
   */
  model() {
    const hash = this.modelFor('lead-report').get('hash');
    const variables = { hash, refreshEntries: false };

    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'reportForms');
  },

  afterModel(forms) {
    if (forms.length) {
      return this.transitionTo('lead-report.forms.submissions', forms[0].id);
    }
  },
});
