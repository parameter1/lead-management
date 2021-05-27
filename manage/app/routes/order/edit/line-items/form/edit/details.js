import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/line-item/form/edit/details';

export default Route.extend(RouteQueryManager, {
  model() {
    const { id } = this.modelFor('order.edit.line-items.form.edit');
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'formLineItem');
  },
});
