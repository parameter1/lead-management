import Component from '@ember/component';
import { get, computed } from '@ember/object';

export default Component.extend({
  tagName: 'table',
  classNames: ['table', 'table-striped', 'table-sm'],

  title: null,

  displayDelivered: computed('displayDeliveredMetrics', 'sends.@each.send.isNewsletter', function() {
    if (this.get('displayDeliveredMetrics')) return true;
    const sends = this.get('sends');
    const hasNewsletters = sends.map(({ send }) => send.isNewsletter).some(v => v === true);
    if (hasNewsletters) return false;
    return true;
  }),

  displayUniqueClicks: computed('sends.@each.send.isNewsletter', function() {
    const sends = this.get('sends');
    return sends.every(({ send }) => send.isNewsletter);
  }),

  init() {
    this._super(...arguments);
    this.set('iframe', {
      show: false,
      title: null,
      src: null,
    });
  },

  actions: {
    displayIframeModal(send) {
      this.set('iframe.title', get(send, 'name'));
      this.set('iframe.src', get(send, 'url'));
      this.set('iframe.show', true);
    },
  },
});
