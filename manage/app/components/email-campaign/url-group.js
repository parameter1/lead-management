import Component from '@ember/component';
import { computed, set } from '@ember/object';

export default Component.extend({
  classNames: ['card'],
  urlGroup: null,

  disabled: false,

  deploymentGroups: computed.reads('urlGroup.deploymentGroups.[]'),

  isUrlActive: computed('deploymentGroups.@each.active', function() {
    return this.get('deploymentGroups').reduce((bool, d) => d.active ? true : bool, false);
  }),

  actions: {
    toggleUrlGroupActive(event) {
      const { target } = event;
      const { checked } = target;
      const deploymentGroups = this.get('deploymentGroups');
      deploymentGroups.forEach(deploymentGroup => set(deploymentGroup, 'active', checked));
      this.send('sendChange');
    },
    sendChange() {
      this.get('on-change')();
    },
  },

});
