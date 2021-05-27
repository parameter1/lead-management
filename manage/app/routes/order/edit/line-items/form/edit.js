import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/line-item/form/edit';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ line_item_id: id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'formLineItem');
  },

  setupController(controller, model) {
    this._super(controller, model);
    controller.set('order', this.modelFor('order.edit'));
  },
});
