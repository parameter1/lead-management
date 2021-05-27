import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import linkTypesMutation from 'leads-manage/gql/mutations/line-item/email/link-types';
import tagsMutation from 'leads-manage/gql/mutations/line-item/email/tags';
import excludedTagsMutation from 'leads-manage/gql/mutations/line-item/email/excluded-tags';
import categoriesMutation from 'leads-manage/gql/mutations/line-item/email/categories';

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

    async setCategories(categories) {
      this.startAction();
      const id = this.get('model.id');
      const categoryIds = categories.map(category => category.id);
      const input = { id, categoryIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: categoriesMutation, variables, refetchQueries }, 'emailLineItemCategories');
        this.get('notify').info('Email categories saved.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
