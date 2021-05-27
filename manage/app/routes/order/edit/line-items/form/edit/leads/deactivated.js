import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import RouteObservableMixin from 'leads-manage/mixins/route-observable-mixin';

import query from 'leads-manage/gql/queries/line-item/form/edit/leads';

export default Route.extend(RouteQueryManager, RouteObservableMixin, {
  async model() {
    const { id } = this.modelFor('order.edit.line-items.form.edit');
    const variables = { input: { id, active: false } };
    const queryKey = 'formLineItemLeads';
    this.getController().set('resultKey', queryKey);
    const response = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, queryKey);
    this.getController().set('observable', this.getObservable(response))
    return response;
  },
});
