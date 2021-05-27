import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/content-query-result/all';
import search from 'leads-manage/gql/queries/content-query-result/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    this.getController().set('campaign', this.modelFor('campaign.edit'));

    const queryId = this.modelFor('behavior.view').get('id');
    const vars = { queryId };

    return this.getResults({
      query,
      queryKey: 'allContentQueryResults',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchContentQueryResults',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
