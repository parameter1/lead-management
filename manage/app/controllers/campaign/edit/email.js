import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import emailCampaignTags from 'leads-manage/gql/mutations/campaign/email/tags';
import emailCampaignExcludedTags from 'leads-manage/gql/mutations/campaign/email/excluded-tags';
import emailCampaignLinkTypes from 'leads-manage/gql/mutations/campaign/email/link-types';
import emailCampaignExcludedFields from 'leads-manage/gql/mutations/campaign/email/excluded-fields';
import emailCampaignIdentityFilters from 'leads-manage/gql/mutations/campaign/email/identity-filters';
import emailCampaignStatus from 'leads-manage/gql/mutations/campaign/email/status';
import emailCampaignRestrictSentDate from 'leads-manage/gql/mutations/campaign/email/restrict-sent-date';
import emailCampaignDisplayDeliveredMetrics from 'leads-manage/gql/mutations/campaign/email/display-delivered-metrics';

export default Controller.extend(FormMixin, {
  apollo: inject(),
  identityAttributes: inject(),
  linkTypes: inject(),

  linkTypeOptions: computed('linkTypes.types', 'model.allowedLinkTypes', function() {
    const selected = this.get('model.allowedLinkTypes');
    return this.get('linkTypes.types').filter(type => !selected.includes(type));
  }),

  isEditorial: computed('model.{tags.@each.name,allowedLinkTypes.[]}', function() {
    const pr = this.get('model.tags').find(tag => tag.name === 'PR');
    const editorialLink = this.get('model.allowedLinkTypes').includes('Editorial');
    if (pr || editorialLink) return true;
    return false;
  }),

  excludeFieldOptions: computed('identityAttributes.getViewableFields', 'model.excludeFields', function() {
    const selected = this.get('model.excludeFields');
    return this.get('identityAttributes.getViewableFields').filter(o => !selected.includes(o.key));
  }),

  areExcludeFieldsDisabled: computed.reads('isEditorial'),

  selectedFieldOptions: computed('identityAttributes.getViewableFields', 'model.excludeFields', 'isEditorial', function() {
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
        await this.get('apollo').mutate({ mutation: emailCampaignTags, variables }, 'emailCampaignTags');
        this.get('notify').info('Campaign tags set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     * @param {*} tags
     */
    async updateExcludedTags(tags) {
      this.startAction();
      const id = this.get('model.id');
      const tagIds = tags.map(tag => tag.id);
      const input = { id, tagIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: emailCampaignExcludedTags, variables }, 'emailCampaignExcludedTags');
        this.get('notify').info('Campaign tags successfully excluded.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     * @param {*} linkTypes
     */
    async updateLinkTypes(linkTypes) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, linkTypes };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: emailCampaignLinkTypes, variables }, 'emailCampaignLinkTypes');
        this.get('notify').info('Campaign link types set successfully.');
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
        await this.get('apollo').mutate({ mutation: emailCampaignExcludedFields, variables }, 'emailCampaignExcludedFields');
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
        await this.get('apollo').mutate({ mutation: emailCampaignIdentityFilters, variables }, 'emailCampaignIdentityFilters');
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
        await this.get('apollo').mutate({ mutation: emailCampaignStatus, variables }, 'emailCampaignStatus');
        this.get('notify').info('Campaign status set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     */
    async updateRestrictToSentDate(event) {
      this.startAction();
      const { target } = event;
      const { checked } = target;
      const id = this.get('model.id');
      const input = { id, restrictToSentDate: checked };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: emailCampaignRestrictSentDate, variables }, 'emailCampaignRestrictSentDate');
        this.get('notify').info('Campaign sent date rules set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     */
    async updateDisplayDeliveredMetrics(event) {
      this.startAction();
      const { target } = event;
      const { checked } = target;
      const id = this.get('model.id');
      const input = { id, displayDeliveredMetrics: checked };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: emailCampaignDisplayDeliveredMetrics, variables }, 'emailCampaignDisplayDeliveredMetrics');
        this.get('notify').info('Campaign delivered metrics rule successfully applied.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
