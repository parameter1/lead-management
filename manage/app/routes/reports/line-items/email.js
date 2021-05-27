import Route from '@ember/routing/route';

export default Route.extend({
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
  },
});
