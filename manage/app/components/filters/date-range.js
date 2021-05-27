import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';

export default Component.extend({
  classNames: ['form-group'],

  center: moment(),

  label: 'Dates',
  start: null,
  end: null,
  disabled: false,

  range: computed('start', 'end', function() {
    const { start, end } = this;
    return {
      start,
      end,
    };
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
      this.onChange({ start: null, end: null });
    },
  },
});
