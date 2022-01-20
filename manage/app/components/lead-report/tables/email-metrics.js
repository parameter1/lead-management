import Component from '@ember/component';
import { get, computed } from '@ember/object';

export default Component.extend({
  tagName: 'table',
  classNames: ['table', 'table-striped', 'table-sm'],

  title: null,

  displayDelivered: computed('displayDeliveredMetrics', 'deployments.@each.deployment.designation', function() {
    if (this.get('displayDeliveredMetrics')) return true;
    const deployments = this.get('deployments');
    const hasNewsletters = deployments.map(({ deployment }) => deployment.designation === 'Newsletter').some(v => v === true);
    if (hasNewsletters) return false;
    return true;
  }),

  displayUniqueClicks: computed('deployments.@each.deployment.designation', function() {
    const deployments = this.get('deployments');
    return deployments.every(({ deployment }) => deployment.designation === 'Newsletter');
  }),

  displayTotalUniqueClicks: false,

  init() {
    this._super(...arguments);
    this.set('iframe', {
      show: false,
      title: null,
      src: null,
    });
  },

  actions: {
    displayIframeModal(deployment) {
      this.set('iframe.title', get(deployment, 'name'));
      this.set('iframe.src', get(deployment, 'url'));
      this.set('iframe.show', true);
    },
  },
});
