import Controller from '@ember/controller';
import { computed, get } from '@ember/object';

const { isArray } = Array;

export default Controller.extend({
  totalImpressions: computed('model.gamLineItemReport.[]', function() {
    const rows = this.get('model.gamLineItemReport');
    if (!isArray(rows)) return 0;
    return rows.reduce((n, row) => {
      const v = parseInt(get(row, 'Column.AD_SERVER_IMPRESSIONS'), 10);
      if (!v) return n;
      return n + v;
    }, 0);
  }),

  totalClicks: computed('model.gamLineItemReport.[]', function() {
    const rows = this.get('model.gamLineItemReport');
    if (!isArray(rows)) return 0;
    return rows.reduce((n, row) => {
      const v = parseInt(get(row, 'Column.AD_SERVER_CLICKS'), 10);
      if (!v) return n;
      return n + v;
    }, 0);
  }),

  avgCTR: computed('model.gamLineItemReport.[]', function() {
    const impressions = this.get('totalImpressions');
    if (!impressions) return 0;
    return this.get('totalClicks') / impressions;
  }),
});
