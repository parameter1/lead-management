import Mixin from '@ember/object/mixin';
import RouteObservableMixin from 'leads-manage/mixins/route-observable-mixin';

export default Mixin.create(RouteObservableMixin, {
  queryParams: {
    searchPhrase: {
      refreshModel: true,
      replace: true,
    },
    searchField: {
      refreshModel: true,
      replace: true,
    },
    limit: {
      refreshModel: true
    },
    sortField: {
      refreshModel: true
    },
    ascending: {
      refreshModel: true
    },
  },

  /**
   *
   * @param {object} params
   */
  async getResults({ query, queryKey, queryVars } = {}, {
    limit,
    sortField,
    ascending,
    searchPhrase,
    searchField,
  } = {}) {

    const input = {
      sort: { field: sortField, order: ascending ? 'ASC' : 'DESC' },
      ...(limit && { limit }),
      ...(searchPhrase && { search: { field: searchField, phrase: searchPhrase } }),
      ...queryVars,
    };

    const variables = { input };
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
