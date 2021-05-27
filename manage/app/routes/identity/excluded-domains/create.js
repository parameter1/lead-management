import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import mutation from 'leads-manage/gql/mutations/excluded-email-domain/create';

export default Route.extend(RouteQueryManager, FormMixin, {
  model() {
    return {};
  },

  actions: {
    async create({ domain }) {
      this.startRouteAction();
      const variables = { input: { domain } };
      try {
        await this.get('apollo').mutate({ mutation, variables }, 'createExcludedEmailDomain');
        await this.transitionTo('identity.excluded-domains.index');
        this.get('notify').info('Excluded domain created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
