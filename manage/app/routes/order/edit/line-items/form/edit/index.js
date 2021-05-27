import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/line-item/form/edit/index';

export default Route.extend(RouteQueryManager, {
  model() {
    const { id } = this.modelFor('order.edit.line-items.form.edit');
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'formLineItem');
  },

  setupController(controller, model) {
    this._super(controller, model);
    controller.set('order', this.modelFor('order.edit'));
  },
});
