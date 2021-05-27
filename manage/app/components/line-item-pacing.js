import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['pacing-bar-container'],
  leadsShouldBeAt: 0,
  leadsCurrentlyAt: 0,

  leadsShouldBeAtPct: 0,
  leadsCurrentlyAtPct: 0,
  pacingRate: 0,

  shouldBe: computed('leadsShouldBeAt', function() {
    return Math.round(this.get('leadsShouldBeAt'));
  }),

  type: computed('pacingRate', function() {
    const rate = this.get('pacingRate');
    if (rate >= 0) return 'success';
    if (rate >= -0.25) return 'warning';
    return 'danger';
  }),
});
