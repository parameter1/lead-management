import Mixin from '@ember/object/mixin';
import moment from 'moment';
import { computed } from '@ember/object';

export default Mixin.create({
  center: computed('model.range.start', function() {
    const start = this.get('model.range.start');
    return start ? moment(start) : null;
  }),

  range: computed('model.range.{start,end}', function() {
    const start = this.get('model.range.start');
    const end = this.get('model.range.end');
    return {
      start: start ? moment(start) : null,
      end: end ? moment(end) : null,
    }
  }),

  actions: {
    setDateRange({ start, end }) {
      this.set('model.range.start', start);
      this.set('model.range.end', end);
    },
  },
});
