import Controller from '@ember/controller';
import ActionMixin from 'leads-manage/mixins/action-mixin';
import { inject } from '@ember/service';

import adMetricsExcludedGAMLineItemIds from 'leads-manage/gql/mutations/campaign/ad-metrics/excluded-gam-line-item-ids';
import adMetricsCampaignStatus from 'leads-manage/gql/mutations/campaign/ad-metrics/status';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    /**
     *
     */
    async toggleExcludedGAMLineItem(lineItem, isExcluded) {
      try {
        this.startAction();

        const toggled = !isExcluded;
        let excludedIds = this.get('model.adMetrics.excludedGAMLineItemIds').slice();
        if (toggled) {
          excludedIds.push(lineItem.id)
        } else {
          excludedIds = excludedIds.filter((id) => id !== lineItem.id);
        }
        const variables = { input: { id: this.get('model.id'), excludedIds } };
        await this.get('apollo').mutate({ mutation: adMetricsExcludedGAMLineItemIds, variables }, 'campaign');
        this.get('notify').info('Line items set successfully.');
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
      try {
        this.startAction();
        const { checked } = event.target;
        const variables = { input: { id: this.get('model.id'), enabled: checked } };
        await this.get('apollo').mutate({ mutation: adMetricsCampaignStatus, variables }, 'campaign');
        this.get('notify').info('Campaign status set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    }
  },
});
