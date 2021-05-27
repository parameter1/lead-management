import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/user/list';
import search from 'leads-manage/gql/queries/user/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allUsers',
    }, {
      search,
      searchKey: 'searchUsers',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
