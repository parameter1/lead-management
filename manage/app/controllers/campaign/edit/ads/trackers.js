import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';

import adCampaignExcludedTrackers from 'leads-manage/gql/mutations/campaign/ads/excluded-trackers';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  actions: {
    async updateExcludedTrackers(trackerId, active) {
      this.startAction();
      const id = this.get('model.id');
      const excludeTrackerIds = this.get('model.excludeTrackers').map(t => t.id).filter(id => id !== trackerId);
      if (!active) {
        excludeTrackerIds.push(trackerId);
      }

      const input = { id, excludeTrackerIds };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: adCampaignExcludedTrackers, variables }, 'adCampaignExcludedTrackers');
        this.get('notify').info('Campaign ad trackers successfully excluded.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
