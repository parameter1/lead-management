import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import query from 'leads-manage/gql/queries/campaign/email-identities';
import search from 'leads-manage/gql/queries/campaign/search-email-identities';

export default Route.extend(ListRouteMixin, FormMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    this.getController().set('campaign', this.modelFor('campaign.edit'));

    const id = this.modelFor('campaign.edit.email').get('id');
    const vars = { id };

    return this.getResults({
      query,
      queryKey: 'emailCampaignIdentities',
      queryVars: vars,
    }, {
      search,
      searchVars: vars,
      searchKey: 'searchEmailCampaignIdentities',
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
