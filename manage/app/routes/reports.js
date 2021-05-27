import Route from '@ember/routing/route';

export default Route.extend({
  setupController() {
    this._super(...arguments);
    this.controllerFor('application').set('displayNav', false);
  },

  actions: {
    willTransition(transition) {
      const { targetName } = transition;
      if (targetName.indexOf('reports') !== 0) {
        this.controllerFor('application').set('displayNav', true);
      }
    },
  },
});
