import Route from '@ember/routing/route';
import { getObservable } from 'ember-apollo-client';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/reports/line-items/email/identities';

export default Route.extend(RouteQueryManager, {
  /**
   *
   * @param {object} params
   */
  async model({ first, sortBy, ascending }) {
    const controller = this.controllerFor(this.get('routeName'));
    controller.set('lineitem', this.modelFor('reports.line-items'));

    const hash = this.modelFor('reports.line-items').get('hash');
    const pagination = { first };
    const sort = { field: sortBy, order: ascending ? 1 : -1 };

    const variables = { hash, pagination, sort };
    if (!sortBy) delete variables.sort.field;

    try {
      const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailLineItemIdentitiesReport');
      controller.set('observable', getObservable(result));
      return result;
    } catch (e) {
      this.get('graphErrors').show(e)
    }
  },
});
