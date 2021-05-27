import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/gam/advertiser/view';

export default Route.extend(RouteQueryManager, {
  model({ company_id }) {
    const input = { id: company_id };
    const variables = { input };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'cache-and-network' }, 'gam_company');
  },
});
