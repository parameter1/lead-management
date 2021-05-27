import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { set } from '@ember/object';

import formCampaignStatus from 'leads-manage/gql/mutations/campaign/forms/status';
import formCampaignExcludedForms from 'leads-manage/gql/mutations/campaign/forms/excluded-forms';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  actions: {
    /**
     *
     */
    async updateStatus(event) {
      this.startAction();
      const { target } = event;
      const { checked } = target;
      const id = this.get('model.id');
      const input = { id, enabled: checked };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: formCampaignStatus, variables }, 'formCampaignStatus');
        this.get('notify').info('Campaign status set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async updateExcludedForm(index, event) {
      this.startAction();

      const { target } = event;
      const { checked } = target;

      set(this.get(`model.forms.${index}`), 'active', checked);

      const id = this.get('model.id');
      const excludeForms = this.get('model.forms').map(available => ({
        formId: available.form.id,
        active: available.active,
      }));

      const input = { id, excludeForms };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: formCampaignExcludedForms, variables }, 'formCampaignExcludedForms');
        this.get('notify').info('Campaign forms successfully set.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
