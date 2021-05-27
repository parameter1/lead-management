import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/form/edit';
import deleteForm from 'leads-manage/gql/mutations/delete-form';
import updateForm from 'leads-manage/gql/mutations/update-form';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'form');
  },
  actions: {
    update({ id, customer, externalSource }) {
      this.startRouteAction();
      const mutation = updateForm;
      const customerId = customer ? get(customer, 'id') : undefined;
      const { identifier, namespace } = externalSource;

      const payload = { customerId, externalSource: { identifier, namespace } };
      const variables = { input: { id, payload } };
      return this.get('apollo').mutate({ mutation, variables }, 'updateForm')
        .then(() => this.get('notify').info('Form successfully updated.'))
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.endRouteAction())
      ;
    },
    delete(id, routeName) {
      this.startRouteAction();
      const mutation = deleteForm;
      const variables = { input: { id } };
      return this.get('apollo').mutate({ mutation, variables }, 'deleteForm')
        .then(() => this.get('notify').info('Form successfully deleted.'))
        .then(() => this.transitionTo(routeName))
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.endRouteAction())
      ;
    },
  },
});
