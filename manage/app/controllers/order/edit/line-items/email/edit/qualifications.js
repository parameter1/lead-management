import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import excludedFieldsMutation from 'leads-manage/gql/mutations/line-item/email/excluded-fields';
import requiredFieldsMutation from 'leads-manage/gql/mutations/line-item/email/required-fields';
import identityFiltersMutation from 'leads-manage/gql/mutations/line-item/email/identity-filters';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  actions: {
    async setExcludedFields(fieldKeys) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, excludedFields: fieldKeys };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: excludedFieldsMutation, variables }, 'emailLineItemExcludedFields');
        this.get('notify').info('Fields successfully excluded.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setRequiredFields(fieldKeys) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, requiredFields: fieldKeys };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: requiredFieldsMutation, variables }, 'emailLineItemRequiredFields');
        this.get('notify').info('Required fields successfully set.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setIdentityFilters(filters) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, filters };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: identityFiltersMutation, variables }, 'emailLineItemIdentityFilters');
        this.get('notify').info('Identity filters saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
