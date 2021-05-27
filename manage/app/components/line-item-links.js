import Component from '@ember/component';
import { ComponentQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import query from 'leads-manage/gql/queries/line-item/email/edit/deployments/links';
import emailLineItemExcludedUrls from 'leads-manage/gql/mutations/line-item/email/excluded-urls';

export default Component.extend(ComponentQueryManager, ActionMixin, {
  lineItemId: null,
  isLoading: false,

  actions: {
    async load() {
      this.startAction();
      this.set('isLoading', true);
      const input = { id: this.get('lineItemId') };
      const variables = { input };

      try {
        const results = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, 'emailLineItem');
        this.set('results', results);
        this.set('hasLoaded', true);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
        this.set('isLoading', false);
      }
    },

    async updateExcludedUrls() {
      this.startAction();
      const id = this.get('lineItemId');
      const excludedUrls = [];

      this.get('results.urlGroups').forEach((urlGroup) => {
        const urlId = urlGroup.url.id;
        urlGroup.deploymentGroups.forEach((depGroup) => {
          depGroup.sendGroups.forEach((sendGroup) => {
            excludedUrls.push({
              urlId,
              sendId: sendGroup.send.id,
              active: sendGroup.active,
            })
          });
        });
      });
      const input = { id, excludedUrls };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: emailLineItemExcludedUrls, variables }, 'emailLineItemExcludedUrls');
        this.get('notify').info('Line item email links successfully excluded.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    }
  },
});
