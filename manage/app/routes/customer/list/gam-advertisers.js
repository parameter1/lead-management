import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/gam-list-route-mixin';

import query from 'leads-manage/gql/queries/gam/advertiser/list';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({
    limit,
    sortField,
    ascending,
    searchPhrase,
    searchField,
  } = {}) {
    return this.getResults({
      query,
      queryKey: 'listGAMAdvertisers',
    }, {
      limit,
      sortField,
      ascending,
      searchPhrase,
      searchField,
    });
  },
});
