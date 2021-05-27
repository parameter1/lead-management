import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/campaign/list';
import search from 'leads-manage/gql/queries/campaign/search';

export default Route.extend(ListRouteMixin, {
  init() {
    this._super(...arguments);
    this.set('queryParams.customers', { refreshModel: true });
    this.set('queryParams.startingBefore', { refreshModel: true });
    this.set('queryParams.startingAfter', { refreshModel: true });
    this.set('queryParams.endingBefore', { refreshModel: true });
    this.set('queryParams.endingAfter', { refreshModel: true });
  },

  /**
   *
   * @param {object} params
   */
  model({
    first,
    sortBy,
    ascending,
    phrase,
    searchType,
    searchBy,
    customers,
    startingBefore,
    startingAfter,
    endingBefore,
    endingAfter,
  }) {
    const { keys } = Object;
    const starting = {
      ...(startingBefore && { before: parseInt(startingBefore, 10) }),
      ...(startingAfter && { after: parseInt(startingAfter, 10) }),
    };
    const ending = {
      ...(endingBefore && { before: parseInt(endingBefore, 10) }),
      ...(endingAfter && { after: parseInt(endingAfter, 10) }),
    };

    const input = {
      customerIds: customers.map((customer) => customer.id),
      ...(keys(starting).length && { starting }),
      ...(keys(ending).length && { ending }),
    };

    return this.getResults({
      query,
      queryKey: 'allCampaigns',
      queryVars: { input },
    }, {
      search,
      searchKey: 'searchCampaigns',
      searchVars: { input },
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },

  /**
   *
   */
  actions: {
    loading(transition) {
      const controller = this.controllerFor(this.get('routeName'));
      controller.set('routeLoading', true);
      transition.promise.finally(() => controller.set('routeLoading', false));
      return true;
    },
  },
});
