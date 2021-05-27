import Controller from '@ember/controller';
import { computed, get } from '@ember/object';

const { isArray } = Array;

export default Controller.extend({
  totalImpressions: computed('model.brightcoveVideoReport.nodes.[]', function() {
    const rows = this.get('model.brightcoveVideoReport.nodes');
    if (!isArray(rows)) return 0;
    return rows.reduce((n, row) => {
      const v = parseInt(get(row, 'video_impression'), 10);
      if (!v) return n;
      return n + v;
    }, 0);
  }),

  totalViews: computed('model.brightcoveVideoReport.nodes.[]', function() {
    const rows = this.get('model.brightcoveVideoReport.nodes');
    if (!isArray(rows)) return 0;
    return rows.reduce((n, row) => {
      const v = parseInt(get(row, 'video_view'), 10);
      if (!v) return n;
      return n + v;
    }, 0);
  }),
});
