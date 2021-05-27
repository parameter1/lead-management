import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/excluded-email-domain/list';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model() {
    return this.getResults({
      query,
      queryKey: 'allExcludedEmailDomains',
    });
  },
});
