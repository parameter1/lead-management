import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';

import query from 'leads-manage/gql/queries/campaign/email';

export default Route.extend(FormMixin, RouteQueryManager, {
  identityAttributes: inject(),
  linkTypes: inject(),

  model() {
    const id = this.modelFor('campaign.edit').get('email.id');
    const variables = { input: { id } };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailCampaign');
  },

  setupController(controller, model) {
    controller.set('campaign', this.modelFor('campaign.edit'));
    this._super(controller, model);
  },
});
