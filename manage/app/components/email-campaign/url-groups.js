import Component from '@ember/component';
import { computed, set } from '@ember/object';

export default Component.extend({
  disabled: false,

  groups: computed.reads('urlGroups.[]'),

  selectAll(active) {
    this.get('groups').forEach((urlGroup) => {
      urlGroup.deploymentGroups.forEach((depGroup) => {
        depGroup.sendGroups.forEach(sendGroup => set(sendGroup, 'active', active));
      });
    });
  },

  actions: {
    selectAll() {
      this.selectAll(true);
      this.send('change');
    },

    deselectAll() {
      this.selectAll(false);
      this.send('change');
    },

    change() {
      this.get('on-change')();
    },
  },
});
