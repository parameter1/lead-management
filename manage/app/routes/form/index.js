import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/form/index';
import search from 'leads-manage/gql/queries/form/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allForms',
    }, {
      search,
      searchKey: 'searchForms',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
