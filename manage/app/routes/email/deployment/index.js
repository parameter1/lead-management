import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/email-deployment/list';
import search from 'leads-manage/gql/queries/email-deployment/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allEmailDeployments',
    }, {
      search,
      searchKey: 'searchEmailDeployments',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
