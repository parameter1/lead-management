import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import mutation from 'leads-manage/gql/mutations/behavior/content-query/create';

export default Route.extend(RouteQueryManager, FormMixin, {
  ohBehaveToken: inject(),

  model() {
    return { criteria: [] };
  },

  actions: {
    async create({ name, criteria }) {
      this.startRouteAction();

      const propertyId = this.get('ohBehaveToken').getPropertyId();
      const formatted = criteria.reduce((agg, group) => {
        const { type, items } = group;
        const ids = items.map(item => item.id);
        agg.push({ type, ids });
        return agg;
      }, []);

      const payload = { propertyId, name, criteria: formatted };
      const variables = { input: { payload } };
      try {
        const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
        const context = { ohBehaveToken };

        const response = await this.get('apollo').mutate({ mutation, variables, context }, 'behaviorCreateContentQuery');
        this.get('notify').success('Query successfully created.');
        this.transitionTo('behavior.view', response.id);
      } catch (e) {
        this.get('graphErrors').show(e)
      } finally {
        this.endRouteAction();
      }
    },
  },
});
