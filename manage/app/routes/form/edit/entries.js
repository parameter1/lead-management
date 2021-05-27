import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import { getObservable } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/form/edit/entries';

export default Route.extend(RouteQueryManager, {
  model() {
    const controller = this.controllerFor(this.get('routeName'));
    const form = this.modelFor('form.edit');

    const pagination = { first: 40 };
    const sort = { field: 'identifier', order: 1 };
    const input = { id: form.id, refreshEntries: true };

    const variables = { input, pagination, sort };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'form')
      .then((result) => {
        controller.set('observable', getObservable(result));
        return result;
      })
      .catch(e => this.get('graphErrors').show(e))
    ;
  },
});
