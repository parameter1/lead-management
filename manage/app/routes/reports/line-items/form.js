import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import RouteObservableMixin from 'leads-manage/mixins/route-observable-mixin';

import query from 'leads-manage/gql/queries/reports/line-items/form/leads';

export default Route.extend(RouteQueryManager, RouteObservableMixin, {
  async model() {
    this.getController().set('lineitem', this.modelFor('reports.line-items'));
    const hash = this.modelFor('reports.line-items').get('hash');
    const variables = { input: { hash, active: true, refresh: true } };
    const queryKey = 'formLineItemLeads';
    this.getController().set('resultKey', queryKey);
    const response = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, queryKey);
    this.getController().set('observable', this.getObservable(response))
    return response;
  },
});
