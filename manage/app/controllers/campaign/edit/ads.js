import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import adCampaignStatus from 'leads-manage/gql/mutations/campaign/ads/status';
import adCampaignTags from 'leads-manage/gql/mutations/campaign/ads/tags';
import adCampaignExcludedFields from 'leads-manage/gql/mutations/campaign/ads/excluded-fields';
import adCampaignIdentityFilters from 'leads-manage/gql/mutations/campaign/ads/identity-filters';

export default Controller.extend(FormMixin, {
  apollo: inject(),
  identityAttributes: inject(),

  excludeFieldOptions: computed('identityAttributes.getViewableFields', 'model.excludeFields', function() {
    const selected = this.get('model.excludeFields');
    return this.get('identityAttributes.getViewableFields').filter(o => !selected.includes(o.key));
  }),

  selectedFieldOptions: computed('identityAttributes.getViewableFields', 'model.excludeFields', function() {
    const selected = this.get('model.excludeFields');
    return this.get('identityAttributes.getViewableFields').filter(o => selected.includes(o.key));
  }),

  actions: {
    /**
     *
     * @param {*} tags
     */
    async updateTags(tags) {
      this.startAction();
      const id = this.get('model.id');
      const tagIds = tags.map(tag => tag.id);
      const input = { id, tagIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: adCampaignTags, variables }, 'adCampaignTags');
        this.get('notify').info('Campaign tags set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     */
    async updateExcludeFields(fields) {
      this.startAction();
      const id = this.get('model.id');
      const excludeFields = fields.map(field => field.key);
      const input = { id, excludeFields };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: adCampaignExcludedFields, variables }, 'adCampaignExcludedFields');
        this.get('notify').info('Campaign fields successfully excluded.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     */
    async updateIdentityFilters(filters) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, filters };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: adCampaignIdentityFilters, variables }, 'adCampaignIdentityFilters');
        this.get('notify').info('Identity filters saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

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
        await this.get('apollo').mutate({ mutation: adCampaignStatus, variables }, 'adCampaignStatus');
        this.get('notify').info('Campaign status set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
