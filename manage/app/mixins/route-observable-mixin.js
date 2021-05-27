import Mixin from '@ember/object/mixin';
import { inject } from '@ember/service';
import { getObservable } from 'ember-apollo-client';
import { RouteQueryManager } from 'ember-apollo-client';

export default Mixin.create(RouteQueryManager, {
  /**
   * The GraphQL error handler.
   */
  graphErrors: inject(),

  /**
   * Gets the observable for the provided result.
   */
  getObservable(result) {
    return getObservable(result);
  },

  /**
   * Gets the controller for the current route.
   */
  getController() {
    return this.controllerFor(this.get('routeName'));
  },
});
