import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  selected: null,
  minDate: null,
  maxDate: null,

  center: moment(),

  disableRemove: computed('selected', function() {
    return this.get('selected') ? false : true;
  }),

  momentSelected: computed('selected', 'selected._i', function() {
    const selected = this.get('selected');
    if (selected) return moment(selected);
  }),

  momentMaxDate: computed('maxDate', 'maxDate._i', function() {
    const maxDate = this.get('maxDate');
    if (maxDate) return moment(maxDate);
  }),

  momentMinDate: computed('minDate', 'minDate._i', function() {
    const minDate = this.get('minDate');
    if (minDate) return moment(minDate);
  }),

  init() {
    this._super(...arguments);
    const selected = this.get('selected');
    if (selected) this.set('center', moment(selected));
  },

  actions: {
    clearDate() {
      this.set('selected', null);
    },
  },
});
