import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/campaign/email-links';

export default Route.extend(FormMixin, RouteQueryManager, {
  queryParams: {
    'deployments-filter': '',
  },

  async model(params) {
    const id = this.modelFor('campaign.edit.email').get('id');
    const deploymentsFilter = params['deployments-filter'];
    const urlGroupsInput = deploymentsFilter ? { deploymentsFilter } : null;
    const variables = {
      input: { id },
      ...urlGroupsInput && { urlGroupsInput },
    };
    const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailCampaign');
    return {...result, deploymentsFilter };
  },
});
