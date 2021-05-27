import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import moment from 'moment';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import query from 'leads-manage/gql/queries/email-report/run';

export default Controller.extend(ComponentQueryManager, LoadingMixin, {
  center: moment(),
  isRunning: false,

  canSubmit: computed('isRunning', 'range.{start,end}', function() {
    if (this.get('isRunning')) return false;
    if (this.get('range.start') && this.get('range.end')) return true;
    return false;
  }),

  start: computed('range.start', function() {
    const start = this.get('range.start');
    if (!start) return start;
    return start.valueOf();
  }),

  end: computed('range.end', function() {
    const end = this.get('range.end');
    if (!end) return end;
    return end.valueOf();
  }),

  init() {
    this._super(...arguments);
    this.set('range', {
      start: moment().startOf('week'),
      end: moment().endOf('week'),
    });
  },

  actions: {
    setRange(range) {
      const { start, end } = range;
      this.set('range', {
        start: start ? moment(start).startOf('week') : start,
        end: end ? moment(end).endOf('week') : end,
      });
    },

    async runReport() {
      if (this.get('canSubmit')) {
        this.set('isRunning', true);
        this.showLoading();

        const input = {
          start: this.get('range.start').valueOf(),
          end: this.get('range.end').valueOf(),
        }
        const variables = { input };

        try {
          const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailDeploymentReport');
          this.set('result', result);
        } catch (e) {
          this.get('graphErrors').show(e);
        } finally {
          this.hideLoading();
          this.set('isRunning', false);
        }
      }
    },
  },
});
