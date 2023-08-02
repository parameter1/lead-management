import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/email/campaign-metrics';

export default Route.extend(ListRouteMixin, {
  config: inject(),
  init() {
    this._super(...arguments);
    this.set('queryParams.customers', { refreshModel: true });
    this.set('queryParams.salesReps', { refreshModel: true });
    this.set('queryParams.rangeStart', { refreshModel: true });
    this.set('queryParams.rangeEnd', { refreshModel: true });
    this.set('queryParams.mustHaveEmailDeployments', { refreshModel: true });
    this.set('queryParams.showAdvertiserCTOR', { refreshModel: true });
    this.set('queryParams.showTotalAdClicksPerDay', { refreshModel: true });
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
    salesReps,
    rangeStart,
    rangeEnd,
    mustHaveEmailDeployments,
    showAdvertiserCTOR,
    showTotalAdClicksPerDay,
  }) {
    const input = {
      customerIds: customers.map((customer) => customer.id),
      salesRepIds: salesReps.map((user) => user.id),
      mustHaveEmailEnabled: true,
      mustHaveEmailDeployments,
      dateRange: {
        start: rangeStart.valueOf(),
        end: rangeEnd.valueOf(),
      },
    };
    this.set('showAdvertiserCTOR', showAdvertiserCTOR);
    this.set('showTotalAdClicksPerDay', showTotalAdClicksPerDay);

    return this.getResults({
      query,
      queryKey: 'allCampaigns',
      queryVars: { input },
    }, {}, { first, sortBy, ascending });
  },

  setupController(controller, model) {
    this._super(controller, model);
    const defaultAdvertiserCTORState = typeof this.config.isSettingSet("advertiserCTORInitialVisibility") === 'boolean' ? this.config.isSettingSet("advertiserCTORInitialVisibility") : true;
    const queryParamShowAdvertiserCTOR = this.get('showAdvertiserCTOR');
    if (typeof queryParamShowAdvertiserCTOR === 'string' && queryParamShowAdvertiserCTOR === 'true') {
      controller.set('showAdvertiserCTOR', true);
    } else if (typeof queryParamShowAdvertiserCTOR === 'string' && queryParamShowAdvertiserCTOR === 'false') {
      controller.set('showAdvertiserCTOR', false);
    } else {
      controller.set('showAdvertiserCTOR', defaultAdvertiserCTORState);
    }
    const defaultShowTotalAdClicksPerDayState = typeof this.config.isSettingSet("totalAdClicksPerDayInitialVisibility") === 'boolean' ? this.config.isSettingSet("totalAdClicksPerDayInitialVisibility") : true;
    const queryParamShowTotalAdClicksPerDay = this.get('showTotalAdClicksPerDay');
    if (typeof queryParamShowTotalAdClicksPerDay === 'string' && queryParamShowTotalAdClicksPerDay === 'true') {
      controller.set('showTotalAdClicksPerDay', true);
    } else if (typeof queryParamShowTotalAdClicksPerDay === 'string' && queryParamShowTotalAdClicksPerDay === 'false') {
      controller.set('showTotalAdClicksPerDay', false);
    } else {
      controller.set('showTotalAdClicksPerDay', defaultShowTotalAdClicksPerDayState);
    }
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
