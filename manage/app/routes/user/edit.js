import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/user/view';
import deleteUser from 'leads-manage/gql/mutations/delete-user';
import updateUser from 'leads-manage/gql/mutations/update-user';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'user');
  },
  actions: {
    async update(model) {
      this.startRouteAction();
      const mutation = updateUser;
      const { id, email, givenName, familyName, role } = model;
      const payload = { email, givenName, familyName, role };
      const input = { id, payload };
      const variables = { input };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'updateUser');
        this.get('notify').info('User successfully updated.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },

    async delete(id, routeName) {
      this.startRouteAction();
      const mutation = deleteUser;
      const variables = { input: { id } };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'deleteUser');
        await this.transitionTo(routeName);
        this.get('notify').info('User successfully deleted.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
