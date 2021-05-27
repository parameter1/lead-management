import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['form-group'],

  disabled: false,

  isTrackerActive: computed('excludeTrackers.@each.id', 'tracker.id', function() {
    return !this.get('excludeTrackers').map(t => t.id).includes(this.get('tracker.id'));
  }),

  actions: {
    toggleActiveTracker() {
      const active = this.get('isTrackerActive');
      this.get('on-change')(this.get('tracker.id'), !active);
    },
  },
});
