import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/extracted-url/list';
import search from 'leads-manage/gql/queries/extracted-url/search';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    return this.getResults({
      query,
      queryKey: 'allExtractedUrls',
    }, {
      search,
      searchKey: 'searchExtractedUrls',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
