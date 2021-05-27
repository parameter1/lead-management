import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/email-category/list';
import search from 'leads-manage/gql/queries/email-category/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allEmailCategories',
    }, {
      search,
      searchKey: 'searchEmailCategories',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
