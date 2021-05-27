import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import query from 'leads-manage/gql/queries/video/edit';
import link from 'leads-manage/gql/mutations/video/customer';

export default Route.extend(RouteQueryManager, ActionMixin, {
  model({ id }) {
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'brightcoveCMSVideo');
  },

  actions: {
    async update({ id, customers }) {
      try {
        this.startRouteAction();
        const customerIds = customers ? customers.map((c) => c.id) : [];
        const mutation = link;
        const input = { videoId: id, customerIds };
        const variables = { input };
        await this.get('apollo').mutate({ mutation, variables }, 'linkBrightcoveVideoToCustomers');
      } catch (e) {
        this.get('graphErrors').show(e)
      } finally {
        this.endRouteAction()
      }
    },
  }
});
