import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/email-category/view';
import rollupCategoryMetrics from 'leads-manage/gql/mutations/rollup-email-category-metrics';

export default Route.extend(RouteQueryManager, FormMixin, {
  model({ id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailCategory');
  },

  actions: {
    update({ id, rollupMetrics, isNewsletter }) {
      this.startRouteAction();
      const mutation = rollupCategoryMetrics;
      const variables = { categoryId: id, rollupMetrics, isNewsletter };
      return this.get('apollo').mutate({ mutation, variables }, 'rollupCategoryMetrics')
        .then(() => this.get('notify').info('Category successfully updated.'))
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.endRouteAction())
      ;
    },
  },
});
