import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { getObservable } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/form/edit/entries';

export default Route.extend(FormMixin, RouteQueryManager, {
  model({ form_id }) {
    const controller = this.controllerFor(this.get('routeName'));

    const campaign = this.modelFor('campaign.edit');
    const { maxIdentities, startDate, endDate } = campaign;

    const pagination = { first: 40 };
    const sort = { field: 'identifier', order: 1 };
    const input = { id: form_id, refreshEntries: false };
    const entriesInput = {
      suppressInactives: false,
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
