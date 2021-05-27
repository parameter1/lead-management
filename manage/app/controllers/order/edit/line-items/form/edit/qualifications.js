import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import choiceFiltersMutation from 'leads-manage/gql/mutations/line-item/form/choice-filters';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  actions: {
    async setChoiceFilters(filters) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, filters };
      const variables = { input };
      try {
        await this.get('apollo').mutate({ mutation: choiceFiltersMutation, variables }, 'formLineItemChoiceFilters');
        this.get('notify').info('Choice filters saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
