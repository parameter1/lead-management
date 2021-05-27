import Route from '@ember/routing/route';
import RouteSearchMixin from 'leads-manage/mixins/route-search-mixin';

import query from 'leads-manage/gql/queries/line-item/email/edit/leads/active';
import search from 'leads-manage/gql/queries/line-item/email/edit/leads/active-search';

export default Route.extend(RouteSearchMixin, {
  queryParams: {
    id_phrase: {
      refreshModel: true,
      replace: true,
    },
    id_searchType: {
      refreshModel: true,
      replace: true,
    },
    id_searchBy: {
      refreshModel: true,
      replace: true,
    },
    id_first: {
      refreshModel: true,
    },
    id_sortBy: {
      refreshModel: true,
    },
    id_ascending: {
      refreshModel: true,
    },
  },

  model({
    id_first: first,
    id_sortBy: sortBy,
    id_ascending: ascending,
    id_phrase: phrase,
    id_searchType: searchType,
    id_searchBy: searchBy,
  }) {
    const { id } = this.modelFor('order.edit.line-items.email.edit');
    const vars = { input: { id } };

    return this.getResults({
      query,
      queryKey: 'emailLineItemActiveIdentities',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchEmailLineItemActiveIdentities',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },

  setupController(controller, model) {
    this._super(controller, model);
    const order = this.modelFor('order.edit');
    controller.set('customerId', order.get('customer.id'));
    controller.set('lineItemId', this.modelFor('order.edit.line-items.email.edit'));
  },

  /**
   *
   * @param {object} params
   */
  async getResults({ query, queryKey, queryVars }, { search, searchKey, searchVars }, { first, sortBy, ascending, phrase, searchType, searchBy }) {
    const pagination = { first };
    if (phrase) {
      return this.search({
        query: search,
        resultKey: searchKey,
        vars: searchVars,
      }, {
        searchBy,
        phrase,
        searchType,
        pagination,
      });
    }

    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const variables = { pagination, sort, ...queryVars };
    if (!sortBy) delete variables.sort.field;

    this.getController().set('resultKey', queryKey);
    try {
      const response = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, queryKey);
      this.getController().set('observable', this.getObservable(response));
      return response;
    } catch (e) {
      this.get('graphErrors').show(e);
    }
  },
});
