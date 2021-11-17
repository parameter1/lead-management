import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import linkTypesMutation from 'leads-manage/gql/mutations/line-item/email/link-types';
import tagsMutation from 'leads-manage/gql/mutations/line-item/email/tags';
import excludedTagsMutation from 'leads-manage/gql/mutations/line-item/email/excluded-tags';
import deploymentTypesMutation from 'leads-manage/gql/mutations/line-item/email/deployment-types';
import emailLineItemEnforceMaxEmailDomains from 'leads-manage/gql/mutations/line-item/email/enforce-max-email-domains';

const refetchQueries = ['EditEmailLineItemDeploymentLinks'];

export default Controller.extend(FormMixin, {
  apollo: inject(),

  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  actions: {
    async setLinkTypes(linkTypes) {
      this.startAction();
      const id = this.get('model.id');
      const input = { id, linkTypes };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: linkTypesMutation, variables, refetchQueries }, 'emailLineItemLinkTypes');
        this.get('notify').info('Link types saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setTags(tags) {
      this.startAction();
      const id = this.get('model.id');
      const tagIds = tags.map(tag => tag.id);
      const input = { id, tagIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: tagsMutation, variables, refetchQueries }, 'emailLineItemTags');
        this.get('notify').info('Tags saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setExcludedTags(tags) {
      this.startAction();
      const id = this.get('model.id');
      const tagIds = tags.map(tag => tag.id);
      const input = { id, tagIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: excludedTagsMutation, variables, refetchQueries }, 'emailLineItemExcludedTags');
        this.get('notify').info('Tag exclusions saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    async setDeploymentTypes(deploymentTypes) {
      this.startAction();
      const id = this.get('model.id');
      const entities = deploymentTypes.map(type => type.entity);
      const input = { id, entities };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: deploymentTypesMutation, variables, refetchQueries }, 'emailLineItemDeploymentTypes');
        this.get('notify').info('Deployment types saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

     async updateEnforceMaxEmailDomains(event) {
      try {
        this.startAction();
        const { target } = event;
        const { checked } = target;
        const id = this.get('model.id');
        const input = { id, value: checked }
        const variables = { input };
        await this.get('apollo').mutate({ mutation: emailLineItemEnforceMaxEmailDomains, variables }, 'emailLineItemEnforceMaxEmailDomains');
        this.get('notify').info('Maximum email domain settings applied.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
