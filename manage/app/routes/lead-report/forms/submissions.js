import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import { getObservable } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/form/edit/entries';

export default Route.extend(RouteQueryManager, {
  model({ form_id }) {
    const controller = this.controllerFor(this.get('routeName'));

    const campaign = this.modelFor('lead-report');
    const { maxIdentities, startDate, endDate } = campaign;
    controller.set('campaign', campaign);

    const pagination = { first: 40 };
    const sort = { field: 'identifier', order: 1 };
    const input = { id: form_id, refreshEntries: true };
    const entriesInput = {
      suppressInactives: true,
      max: maxIdentities,
      startDate,
      endDate,
    };

    const variables = { input, entriesInput, pagination, sort };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'form')
      .then((result) => {
        controller.set('observable', getObservable(result));
        return result;
      })
      .catch(e => this.get('graphErrors').show(e))
    ;
  },
});
