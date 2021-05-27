import Route from '@ember/routing/route';

export default Route.extend({
  beforeModel(transition) {
    if (!this.user.get('isAdmin')) {
     transition.abort();
     this.transitionTo('index');
    }
  },
});
