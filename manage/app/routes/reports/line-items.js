import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/reports/line-items/hash';

export default Route.extend(RouteQueryManager, {
  model({ hash }) {
    const input = { hash };
    const variables = { input };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'lineItemByHash');
  },
});
