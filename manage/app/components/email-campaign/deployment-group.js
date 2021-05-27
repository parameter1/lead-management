import Component from '@ember/component';
import { computed, set } from '@ember/object';

export default Component.extend({
  classNames: ['card'],
  deploymentGroup: null,
  disabled: false,

  isDeploymentActive: computed('deploymentGroup.sendGroups.@each.active', function() {
    return this.get('deploymentGroup.sendGroups').reduce((bool, sg) => sg.active ? true : bool, false);
  }),

  inputId: computed('urlId', 'deploymentGroup.deployment.id', function() {
    return `${this.get('urlId')}-${this.get('deploymentGroup.deployment.id')}`;
  }),

  actions: {
    toggleDeploymentGroupActive(event) {
      const { target } = event;
      const { checked } = target;
      const sendGroups = this.get('deploymentGroup.sendGroups');
      sendGroups.forEach(sendGroup => set(sendGroup, 'active', checked));
      this.get('on-change')();
    },
    toggleSendGroupActive(index, event) {
      const { target } = event;
      const { checked } = target;
      const sendGroup = this.get(`deploymentGroup.sendGroups.${index}`);
      set(sendGroup, 'active', checked);
      this.get('on-change')();
    },
  },

});
