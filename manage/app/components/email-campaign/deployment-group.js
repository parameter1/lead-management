import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['card'],
  deploymentGroup: null,
  disabled: false,

  isDeploymentActive: computed.reads('deploymentGroup.active'),

  deployment: computed.reads('deploymentGroup.deployment'),

  inputId: computed('urlId', 'deploymentGroup.deployment.id', function() {
    return `${this.get('urlId')}-${this.get('deploymentGroup.deployment.id')}`;
  }),

  actions: {
    toggleDeploymentGroupActive(event) {
      const { target } = event;
      const { checked } = target;
      this.set('deploymentGroup.active', checked);
      this.get('on-change')();
    },
  },

});
