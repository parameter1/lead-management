import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import mutation from 'leads-manage/gql/mutations/create-user';

export default Route.extend(FormMixin, RouteQueryManager, {
  model() {
    return {
      role: 'Restricted',
    };
  },

  actions: {
    async create({
      email,
      givenName,
      familyName,
      password,
      confirmPassword,
      role,
    }) {
      this.startRouteAction();
      const payload = {
        email,
        givenName,
        familyName,
        password,
        confirmPassword,
        role,
      };
      const variables = { input: { payload } };
      try {
        const response = await this.get('apollo').mutate({ mutation, variables }, 'createUser');
        await this.transitionTo('user.edit', response.id);
        this.get('notify').info('User created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
