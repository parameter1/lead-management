import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/tag/view';
import deleteTag from 'leads-manage/gql/mutations/delete-tag';
import updateTag from 'leads-manage/gql/mutations/update-tag';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'tag');
  },
  actions: {
    async update(model) {
      this.startRouteAction();
      const mutation = updateTag;
      const { id, name } = model;
      const payload = { name };
      const input = { id, payload };
      const variables = { input };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'updateTag');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },

    async delete(id, routeName) {
      this.startRouteAction();
      const mutation = deleteTag;
      const variables = { input: { id } };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'deleteTag');
        await this.transitionTo(routeName);
        this.get('notify').info('Tag successfully deleted.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
