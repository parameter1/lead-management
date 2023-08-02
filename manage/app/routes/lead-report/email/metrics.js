import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/lead-report/email-metrics';

export default Route.extend(RouteQueryManager, {
  config: inject(),
  queryParams: {
    sortBy: {
      refreshModel: true
    },
    ascending: {
      refreshModel: true
    },
    showAdvertiserCTOR: {
      refreshModel: true
    },
    showTotalAdClicksPerDay: {
      refreshModel: true,
    }
  },

  /**
   *
   * @param {object} params
   */
  model({ sortBy, ascending, showAdvertiserCTOR, showTotalAdClicksPerDay }) {
    const hash = this.modelFor('lead-report').get('hash');

    const sort = { field: sortBy, order: ascending ? 1 : -1 };
    const variables = { hash, sort };
    this.set('showAdvertiserCTOR', showAdvertiserCTOR);
    this.set('showTotalAdClicksPerDay', showTotalAdClicksPerDay);

    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'reportEmailMetrics');
  },

  setupController(controller, model) {
    controller.set('campaign', this.modelFor('lead-report'));
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
});
