import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import FormMixin from 'leads-manage/mixins/form-mixin';
import moment from 'moment';

import query from 'leads-manage/gql/queries/behavior/content-query/ids';
import mutation from 'leads-manage/gql/mutations/content-query-result/create';

export default Controller.extend(FormMixin, {
  apollo: inject(),
  ohBehaveToken: inject(),

  hasSelectedDates: computed.and('range.{start,end}'),

  isDisabled: computed('isActionRunning', 'hasSelectedDates', function() {
    if (this.get('isActionRunning')) return true;
    if (this.get('hasSelectedDates')) return false;
    return true;
  }),

  init() {
    this._super(...arguments);
    this.clearDateRange();
  },

  clearDateRange() {
    const start = moment().subtract(7, 'days').startOf('day');
    const end = moment().endOf('day');
    this.set('range', { start, end });
  },

  create(contentIds) {
    const input = {
      queryId: this.get('model.id'),
      startDate: this.get('range.start').valueOf(),
      endDate: this.get('range.end').valueOf(),
      contentIds,
    };
    const variables = { input };
    return this.get('apollo').mutate({ mutation, variables }, 'createContentQueryResult')
  },

  actions: {
    async run() {
      this.startAction();

      const input = { id: this.get('model.id') };
      const variables = { input };

      try {
        const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
        const context = { ohBehaveToken };
        const ids = await this.get('apollo').query({ query, variables, context, fetchPolicy: 'no-cache' }, 'behaviorContentQueryIds');

        const response = await this.create(ids);
        this.get('notify').success('Query result successfully created.');
        this.transitionToRoute('behavior.view.results.rows', response.id);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
