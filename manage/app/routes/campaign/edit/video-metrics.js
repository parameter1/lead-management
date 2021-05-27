import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/campaign/video-metrics';

export default Route.extend(RouteQueryManager, {
  model() {
    const id = this.modelFor('campaign.edit').get('id');
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'campaign');
  },

  setupController(controller, model) {
    controller.set('campaign', this.modelFor('campaign.edit'));
    this._super(controller, model);
  },
});
