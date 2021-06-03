import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/extracted-url/all-for-deployment';
import search from 'leads-manage/gql/queries/extracted-url/search-for-deployment';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    const id = this.modelFor('email.deployment.view').get('id');
    const vars = { deploymentId: id };

    return this.getResults({
      query,
      queryKey: 'allExtractedUrlsForDeployment',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchExtractedUrlsForDeployment',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
