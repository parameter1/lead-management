import Component from '@ember/component';
import { computed, set } from '@ember/object';

export default Component.extend({
  classNames: ['card'],
  urlGroup: null,

  allSendGroups: computed('urlGroup.deploymentGroups.[]', function() {
    return this.get('urlGroup.deploymentGroups').reduce((acc, dep) => acc.concat(dep.sendGroups), []);
  }),

  isUrlActive: computed('allSendGroups.@each.active', function() {
    return this.get('allSendGroups').reduce((bool, sg) => sg.active ? true : bool, false);
  }),

  actions: {
    toggleUrlGroupActive(event) {
      const { target } = event;
      const { checked } = target;
      const sendGroups = this.get('allSendGroups');
      sendGroups.forEach(sendGroup => set(sendGroup, 'active', checked));
      this.send('sendChange');
    },
    sendChange() {
      this.get('on-change')();
    },
  },

});
