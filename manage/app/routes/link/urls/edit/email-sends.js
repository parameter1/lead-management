import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/email-send/list-for-url';
import search from 'leads-manage/gql/queries/email-send/search-for-url';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    const id = this.modelFor('link.urls.edit').get('id');
    const vars = { urlId: id };

    return this.getResults({
      query,
      queryKey: 'allEmailSendsForUrl',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchEmailSendsForUrl',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
