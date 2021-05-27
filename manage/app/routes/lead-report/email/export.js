import Route from '@ember/routing/route';
import { getObservable } from 'ember-apollo-client';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/lead-report/email-identity-export';

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

    controller.set('campaign', this.modelFor('campaign.edit'));

    const hash = this.modelFor('lead-report').get('hash');
    const pagination = { first };
    const sort = { field: sortBy, order: ascending ? 1 : -1 };

    const variables = { hash, pagination, sort };
    if (!sortBy) delete variables.sort.field;

    try {
      const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'reportEmailIdentityExport');
      controller.set('observable', getObservable(result));
      return result;
    } catch (e) {
      this.get('graphErrors').show(e);
    }
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('excludeFields', this.modelFor('lead-report').get('email.excludeFields'));
  },
});
