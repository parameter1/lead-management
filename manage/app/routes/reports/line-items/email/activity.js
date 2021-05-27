import Route from '@ember/routing/route';
import { getObservable } from 'ember-apollo-client';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/reports/line-items/email/activity';

export default Route.extend(RouteQueryManager, {
  /**
   *
   * @param {object} params
   */
  async model() {
    const controller = this.controllerFor(this.get('routeName'));

    controller.set('lineitem', this.modelFor('reports.line-items'));

    const hash = this.modelFor('reports.line-items').get('hash');
    const variables = { hash };

    try {
      const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailLineItemActivityReport');
      controller.set('observable', getObservable(result));
      return result;
    } catch(e) {
      this.get('graphErrors').show(e);
    }
  },
});
