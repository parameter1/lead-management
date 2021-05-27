import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/extracted-url/all-for-send';
import search from 'leads-manage/gql/queries/extracted-url/search-for-send';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    const id = this.modelFor('email.send.view').get('id');
    const vars = { sendId: id };

    return this.getResults({
      query,
      queryKey: 'allExtractedUrlsForSend',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchExtractedUrlsForSend',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
