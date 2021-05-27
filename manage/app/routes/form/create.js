import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import mutation from 'leads-manage/gql/mutations/create-form';

export default Route.extend(RouteQueryManager, FormMixin, {
  model() {
    return {
      externalSource: {
        identifier: '',
        namespace: 'wufoo',
        isNew: true,
      }
    };
  },

  actions: {
    create({ customer, externalSource }) {
      this.startRouteAction();
      const customerId = customer ? get(customer, 'id') : undefined;
      const { identifier, namespace } = externalSource;

      const payload = { customerId, externalSource: { identifier, namespace } };
      const variables = { input: { payload } };
      return this.get('apollo').mutate({ mutation, variables }, 'createForm')
        .then(response => this.transitionTo('form.edit', response.id))
        .then(() => this.get('notify').info('Form created successfully.'))
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.endRouteAction())
      ;
    },
  },
});
