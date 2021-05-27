import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({

  now: computed(function() {
    return moment();
  }),

  disabled: false,
  hasSelected: computed.and('range.{start,end}'),

  minDate: computed('now', function() {
    // Subtract 91 as the 91st day will have partial data
    return moment(this.get('now')).subtract(91, 'days');
  }),

  init() {
    this._super(...arguments);
    this.set('center', moment());
  },
});
