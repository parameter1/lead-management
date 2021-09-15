import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  classNames: ['form-group'],

  center: moment(),

  label: 'Dates',
  start: null,
  end: null,
  disabled: true,
  canClear: true,

  range: computed('start', 'end', function() {
    const { start, end } = this;
    return {
      start,
      end,
    };
  }),

  selectedLabel: computed('start', 'end', function() {
    const { start, end } = this;
    if (!end) return '';
    const format = 'MMM Do, YYYY';
    return `Selected: ${start.format(format)} - ${end.format(format)}`;
  }),

  hasSelected: computed.or('start', 'end'),
  noDatesSelected: computed.not('hasSelected'),

  init() {
    this._super(...arguments);
    if (this.get('range.start')) this.set('center', moment(this.get('range.start')));
  },

  actions: {
    emitChange({ start, end }) {
      this.onChange({
        start: start ? start.startOf('day').valueOf() : start,
        end: end ? end.endOf('day').valueOf() : end,
      });
    },
    clear() {
      if (this.canClear) this.onChange({ start: null, end: null });
    },
  },
});
