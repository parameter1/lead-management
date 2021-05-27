import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  beforeModel(transition) {
    if (!this.user.get('isAtLeastMember')) {
     transition.abort();
     this.transitionTo('index');
    }
  },
});
