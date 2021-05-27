import Component from '@ember/component';
import FormMixin from 'leads-manage/mixins/form-mixin';
import moment from 'moment';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import archivedMutation from 'leads-manage/gql/mutations/line-item/archived';
import dateRangeMutation from 'leads-manage/gql/mutations/line-item/date-range';
import nameMutation from 'leads-manage/gql/mutations/line-item/name';
import notesMutation from 'leads-manage/gql/mutations/line-item/notes';
import requiredLeadsMutation from 'leads-manage/gql/mutations/line-item/required-leads';
import totalValueMutation from 'leads-manage/gql/mutations/line-item/total-value';

export default Component.extend(FormMixin, {
  apollo: inject(),

  classNames: ['row'],

  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  dateRange: computed('model.range.{start,end}', function() {
    const start = this.get('model.range.start');
    const end = this.get('model.range.end');
    return {
      start: start ? moment(start) : null,
      end: end ? moment(end) : null,
    };
  }),

  actions: {
    async setName(event) {
      this.startAction();
      try {
        const { value } = event.target;
        if (!value) throw new Error('The line item name is required.');
        const id = this.get('model.id');
        const input = { id, name: value };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: nameMutation, variables }, 'lineItemName');
        this.get('notify').info('Name saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setNotes(event) {
      this.startAction();
      try {
        const { value } = event.target;
        const id = this.get('model.id');
        const input = { id, notes: value };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: notesMutation, variables }, 'lineItemNotes');
        this.get('notify').info('Notes saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setRequiredLeads(event) {
      this.startAction();
      try {
        const { value } = event.target;
        const requiredLeads = Number(value);
        if (!requiredLeads || requiredLeads < 1) throw new Error('The total number of leads is required..');
        const id = this.get('model.id');
        const input = { id, requiredLeads: parseInt(value, 10) };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: requiredLeadsMutation, variables }, 'lineItemRequiredLeads');
        this.get('notify').info('Total required leads saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setTotalValue(event) {
      this.startAction();
      try {
        const { value } = event.target;
        const totalValue = Number(value);
        if (totalValue < 0) throw new Error('The total value must be 0 or greater.');
        const id = this.get('model.id');
        const input = { id, totalValue: parseFloat(value, 10) };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: totalValueMutation, variables }, 'lineItemTotalValue');
        this.get('notify').info('Total value saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setArchived(event) {
      this.startAction();
      try {
        const { checked } = event.target;
        const id = this.get('model.id');
        const input = { id, archived: checked };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: archivedMutation, variables }, 'lineItemArchived');
        this.get('notify').info('Archived flag saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setDateRange(range) {
      const { start, end } = range;
      if (!end) {
        this.set('model.range', range);
      } else {
        this.startAction();
        const id = this.get('model.id');
        const input = {
          id,
          range: {
            start: start.valueOf(),
            end: end.valueOf(),
          },
        };
        const variables = { input };
        try {
          await this.get('apollo').mutate({ mutation: dateRangeMutation, variables }, 'lineItemDateRange');
          this.get('notify').info('Date range saved.');
        } catch (e) {
          this.get('graphErrors').show(e);
        } finally {
          this.endAction();
        }
      }
    },
  },
});
