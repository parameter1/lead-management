import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'div',
  classNames: ['input-group'],

  original: null,
  resolved: null,
  settingsDisabled: false,

  disabled: computed('redirected', function() {
    return !this.get('redirected');
  }),

  showResolved: true,

  redirected: computed('original', 'resolved', function() {
    return this.get('original') !== this.get('resolved');
  }),

  url: computed('showResolved', 'disabled', function() {
    if (this.get('disabled')) {
      return this.get('original');
    }
    return this.get('showResolved') ? this.get('resolved') : this.get('original');
  }),

  actions: {
    toggleUrl() {
      this.set('showResolved', !this.get('showResolved'));
    },
    toggleSettings() {
      this.get('on-settings-toggle')();
    },
  },
});
