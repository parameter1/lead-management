import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/behavior/content-query/view';

export default Route.extend(RouteQueryManager, FormMixin, {
  ohBehaveToken: inject(),

  async model({ id }) {
    const propertyId = this.get('ohBehaveToken').getPropertyId();
    const variables = { input: { propertyId, id } };

    const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
    const context = { ohBehaveToken };

    return this.get('apollo').watchQuery({ query, variables, context, fetchPolicy: 'network-only' }, 'behaviorContentQuery');
  },
});
