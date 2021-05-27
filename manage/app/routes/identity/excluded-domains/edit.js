import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/excluded-email-domain/edit';
import deleteExcludedEmailDomain from 'leads-manage/gql/mutations/excluded-email-domain/delete';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ excluded_domain_id: id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'excludedEmailDomain');
  },

  actions: {
    async delete(id, routeName) {
      this.startRouteAction();
      const mutation = deleteExcludedEmailDomain;
      const variables = { input: { id } };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'deleteExcludedEmailDomain');
        await this.transitionTo(routeName);
        this.get('notify').info('Excluded email domain successfully deleted.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
