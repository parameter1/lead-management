import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { get } from '@ember/object';

import mutation from 'leads-manage/gql/mutations/campaign/create';

export default Route.extend(RouteQueryManager, FormMixin, {
  model() {
    return {
      maxIdentities: 200,
      range: {
        start: null,
        end: null,
      },
    };
  },

  actions: {
    async create({ customer, name, range, maxIdentities }) {
      try {
        this.startRouteAction();
        const customerId = get(customer || {}, 'id');
        if (!customerId) throw new Error('A customer is required.');
        if (!range || !range.start || !range.end) throw new Error('A date range is required');

        const input = {
          customerId,
          name,
          startDate: range.start.valueOf(),
          endDate: range.end.valueOf(),
          maxIdentities: parseInt(maxIdentities, 10),
        };
        const variables = { input };
        const response = await this.get('apollo').mutate({ mutation, variables }, 'createCampaign');
        await this.transitionTo('campaign.edit', response.id);
        this.get('notify').info('Campaign created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e)
      } finally {
        this.endRouteAction();
      }
    },
  },
});
