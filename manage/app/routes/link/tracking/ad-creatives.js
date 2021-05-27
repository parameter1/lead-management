import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/ad-creative-tracker/list';
import search from 'leads-manage/gql/queries/ad-creative-tracker/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allAdCreativeTrackers',
    }, {
      search,
      searchKey: 'searchAdCreativeTrackers',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
