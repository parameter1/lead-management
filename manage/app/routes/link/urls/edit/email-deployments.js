import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/email-deployment/list';
import search from 'leads-manage/gql/queries/email-deployment/search';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    const id = this.modelFor('link.urls.edit').get('id');
    const vars = { urlIds: [id] };

    return this.getResults({
      query,
      queryKey: 'allEmailDeployments',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchEmailDeployments',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
