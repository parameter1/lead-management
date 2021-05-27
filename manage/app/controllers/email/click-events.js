import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';
import moment from 'moment';

import query from 'leads-manage/gql/queries/email-click-event-report';

export default Controller.extend(ComponentQueryManager, LoadingMixin, {
  center: moment(),
  isRunning: false,
  includeNewsletters: false,

  canSubmit: computed('isRunning', 'range.{start,end}', function() {
    if (this.get('isRunning')) return false;
    if (this.get('range.start') && this.get('range.end')) return true;
    return false;
  }),

  showResults: computed('isRunning', 'result', function() {
    return Boolean(this.get('result') && !this.get('isRunning'));
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
    this.set('tags', []);
    this.set('customers', []);
  },

  actions: {
    setRange(range) {
      const { start, end } = range;
      this.set('range', {
        start: start ? moment(start).startOf('day') : start,
        end: end ? moment(end).endOf('day') : end,
      });
    },

    setIncludeNewsetters(event) {
      const { checked } = event.target;
      this.set('includeNewsletters', checked);
    },

    async runReport() {
      try {
        this.set('isRunning', true);
        this.showLoading();

        const input = {
          start: this.get('start'),
          end: this.get('end'),
          tagIds: this.get('tags').map((tag) => tag.id),
          customerIds: this.get('customers').map((customer) => customer.id),
          includeNewsletters: this.get('includeNewsletters'),
        };
        const variables = { input };
        const result = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailClickEventReport');
        this.set('result', result);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.hideLoading();
        this.set('isRunning', false);
      }
    },
  },
});
