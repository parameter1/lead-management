import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/email/campaign-metrics';

export default Route.extend(ListRouteMixin, {
  init() {
    this._super(...arguments);
    this.set('queryParams.customers', { refreshModel: true });
    this.set('queryParams.rangeStart', { refreshModel: true });
    this.set('queryParams.rangeEnd', { refreshModel: true });
  },

  beforeModel(transition) {
    if (!this.user.get('isAdmin')) {
     transition.abort();
     this.transitionTo('index');
    }
  },

  /**
   *
   * @param {object} params
   */
  model({
    first,
    sortBy,
    ascending,
    customers,
    rangeStart,
    rangeEnd,
  }) {
    const input = {
      customerIds: customers.map((customer) => customer.id),
      mustHaveEmailEnabled: true,
      dateRange: {
        start: rangeStart.valueOf(),
        end: rangeEnd.valueOf(),
      },
    };

    return this.getResults({
      query,
      queryKey: 'allCampaigns',
      queryVars: { input },
    }, {}, { first, sortBy, ascending });
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
