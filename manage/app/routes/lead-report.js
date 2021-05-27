import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/campaign/hash';

export default Route.extend(RouteQueryManager, {
  model({ hash }) {
    const variables = { hash };
    return this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'campaignByHash');
  },

  afterModel(model) {
    if (model.get('email.enabled')) return;
    if (model.get('forms.enabled') && model.get('forms.forms.length')) return this.transitionTo('lead-report.forms');
    if (model.get('ads.enabled') && model.get('ads.hasIdentities')) return this.transitionTo('lead-report.ads');
    if (model.get('customer.linkedAdvertisers.googleAdManager.nodes.length') && model.get('adMetrics.enabled')) return this.transitionTo('lead-report.ad-metrics');
    if (model.get('customer.linkedVideos.brightcove.nodes.length') && model.get('videoMetrics.enabled')) return this.transitionTo('lead-report.video-metrics');
    return this.transitionTo('lead-report.disabled');
  },

  setupController() {
    this._super(...arguments);
    this.controllerFor('application').set('displayNav', false);
  },

  actions: {
    /**
     *
     * @param {*} transition
     */
    loading(transition) {
      const controller = this.controllerFor(this.get('routeName'));
      controller.set('isLoading', true);
      transition.finally(() => controller.set('isLoading', false));
      return true;
    },

    willTransition(transition) {
      const { targetName } = transition;
      if (targetName.indexOf('lead-report') !== 0) {
        this.controllerFor('application').set('displayNav', true);
      }
    },
  },
});
