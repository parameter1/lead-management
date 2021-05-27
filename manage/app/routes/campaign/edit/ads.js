import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/campaign/ads';

export default Route.extend(FormMixin, RouteQueryManager, {
  model() {
    const id = this.modelFor('campaign.edit').get('ads.id');
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'adCampaign');
  },

  setupController(controller, model) {
    controller.set('campaign', this.modelFor('campaign.edit'));
    this._super(controller, model);
  },
});
