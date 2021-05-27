import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  tagName: 'small',
  classNames: ['d-block'],
  format: 'MMM Do, YYYY',
  futureLabel: 'Starts',
  pastLabel: 'Started',

  date: null,

  isInPast: computed('date', function() {
    const date = this.get('date');
    if (!date) return false;
    return moment(date).isBefore(new Date());
  }).readOnly(),

  label: computed('futureLabel', 'pastLabel', 'isInPast', function() {
    if (this.get('isInPast')) return this.get('pastLabel');
    return this.get('futureLabel');
  }).readOnly(),
});
