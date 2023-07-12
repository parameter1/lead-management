import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import { RouteQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';
import { get } from '@ember/object';
import query from 'leads-manage/gql/queries/application-config';

export default Route.extend(ApplicationRouteMixin, ActionMixin, RouteQueryManager, {
  session: inject(),
  config: inject(),

  model() {
    return this.apollo.query({ query }, 'currentAppConfig');
  },

  afterModel(model) {
    this.config.load(model);
  },

  setupController(controller, model) {
    controller.set('session', this.get('session'));
    this._super(controller, model);
  },

  actions: {
    showLoading() {
      this.showLoading();
    },

    hideLoading() {
      this.hideLoading();
    },

    transitionTo(name) {
      return this.transitionTo(name);
    },

    transitionWithModel(routeName, model) {
      return this.transitionTo(routeName, get(model, 'id'));
    },

    scrollToTop() {
      window.scrollTo(0, 0);
    },

    /**
     *
     * @param {*} transition
     */
    loading(transition) {
      this.showLoading();
      transition.finally(() => this.hideLoading());
    },

    /**
     *
     * @param {Error} e
     */
    error(e) {
      if (this.get('graphErrors').isReady()) {
        this.get('graphErrors').show(e);
      } else {
        this.intermediateTransitionTo('application_error', e);
      }
    },
  },
});
