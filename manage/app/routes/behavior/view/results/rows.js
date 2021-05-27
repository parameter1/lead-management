import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import { getObservable } from 'ember-apollo-client';
import { hash } from 'rsvp';

import query from 'leads-manage/gql/queries/content-query-result/view';
import rowsQuery from 'leads-manage/gql/queries/content-query-result/rows';

export default Route.extend(RouteQueryManager, {
  queryParams: {
    first: {
      refreshModel: true
    },
    after: {
      refreshModel: true
    },
  },

  model({ result_id, first, after , sortBy, ascending }) {
    const controller = this.controllerFor(this.get('routeName'));


    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const pagination = { first, after };
    const variables = { resultId: result_id, pagination, sort };
    if (!sortBy) delete variables.sort.field;
    // This is dumb to use a hash - just do one gql operation for both at the same time.
    return hash({
      rows: this.get('apollo').watchQuery({ query: rowsQuery, variables, fetchPolicy: 'network-only' }, 'allContentQueryResultRows')
        .then((result) => {
          controller.set('observable', getObservable(result));
          return result;
        }),
      result: this.get('apollo').watchQuery({ query, variables: { input: { id: result_id } } }, 'contentQueryResult'),
    }).catch(e => this.get('graphErrors').show(e));

    // let rows;
    // if (this.get('user').roleIs('Administrator', 'Member')) {
    //   rows = this.get('apollo').watchQuery({ query: rowsQuery, variables, fetchPolicy: 'network-only' }, 'allContentQueryResultRows')
    //     .then((result) => {
    //       controller.set('observable', getObservable(result));
    //       return result;
    //     })
    //     .catch(e => this.get('graphErrors').show(e)
    //   );
    // } else {
    //   rows = [];
    // }
    // return hash({
    //   result: this.get('apollo').watchQuery({ query, variables: { input: { id: result_id } } }, 'contentQueryResult'),
    //   rows,
    // });
  },
});
