import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/lead-report/email-metrics';

export default Route.extend(RouteQueryManager, {
  queryParams: {
    sortBy: {
      refreshModel: true
    },
    ascending: {
      refreshModel: true
    },
  },

  /**
   *
   * @param {object} params
   */
  model({ sortBy, ascending }) {
    const hash = this.modelFor('lead-report').get('hash');

    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const variables = { hash, sort };

    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'reportEmailMetrics');
  },

  setupController(controller, model) {
    controller.set('campaign', this.modelFor('lead-report'));
    this._super(controller, model);
  },
});
