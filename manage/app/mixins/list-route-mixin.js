import Mixin from '@ember/object/mixin';
import RouteSearchMixin from 'leads-manage/mixins/route-search-mixin';

export default Mixin.create(RouteSearchMixin, {
  queryParams: {
    phrase: {
      refreshModel: true,
      replace: true,
    },
    searchType: {
      refreshModel: true,
      replace: true,
    },
    searchBy: {
      refreshModel: true,
      replace: true,
    },
    first: {
      refreshModel: true
    },
    sortBy: {
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
  async getResults({ query, queryKey, queryVars } = {}, { search, searchKey, searchVars } = {}, { first, sortBy, ascending, phrase, searchType, searchBy } = {}) {
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
