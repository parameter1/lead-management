import Route from '@ember/routing/route';
import { getObservable } from 'ember-apollo-client';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/reports/line-items/email/export';

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
  async model({ first, sortBy, ascending }) {
    const controller = this.controllerFor(this.get('routeName'));

    const hash = this.modelFor('reports.line-items').get('hash');
    const pagination = { first };
    const sort = { field: sortBy, order: ascending ? 1 : -1 };

    const variables = { hash, pagination, sort };
    if (!sortBy) delete variables.sort.field;

    try {
      const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailLineItemIdentityExportReport');
      controller.set('observable', getObservable(result));
      return result;
    } catch (e) {
      this.get('graphErrors').show(e);
    }
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('excludedFields', this.modelFor('reports.line-items').get('excludedFields'));
  },
});
