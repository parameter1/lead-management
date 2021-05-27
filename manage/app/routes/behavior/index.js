import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import { getObservable } from 'ember-apollo-client';
import { inject } from '@ember/service';

import query from 'leads-manage/gql/queries/behavior/content-query/all';

export default Route.extend(RouteQueryManager, {
  ohBehaveToken: inject(),

  queryParams: {
    first: {
      refreshModel: true
    },
    after: {
      refreshModel: true
    },
    sortBy: {
      refreshModel: true
    },
    ascending: {
      refreshModel: true
    },
  },

  async model({ first, after, sortBy, ascending }) {
    const controller = this.controllerFor(this.get('routeName'));

    const pagination = { first, after };
    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const propertyId = this.get('ohBehaveToken').getPropertyId();
    const variables = { propertyId, pagination, sort };

    const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
    const context = { ohBehaveToken };
    if (!sortBy) delete variables.sort.field;
    return this.get('apollo').watchQuery({ query, variables, context, fetchPolicy: 'network-only' }, 'behaviorAllContentQueries')
      .then((result) => {
        controller.set('observable', getObservable(result));
        return result;
      })
      .catch(e => this.get('graphErrors').show(e))
    ;
  },
});
