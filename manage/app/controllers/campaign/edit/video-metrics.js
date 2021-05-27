import Controller from '@ember/controller';
import ActionMixin from 'leads-manage/mixins/action-mixin';
import { inject } from '@ember/service';

import videoMetricsExcludedBrightcoveVideoIds from 'leads-manage/gql/mutations/campaign/video-metrics/excluded-brightcove-video-ids';
import videoMetricsCampaignStatus from 'leads-manage/gql/mutations/campaign/video-metrics/status';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    /**
     *
     */
    async toggleExcludedBrightcoveVideo(video, isExcluded) {
      try {
        this.startAction();

        const toggled = !isExcluded;
        let excludedIds = this.get('model.videoMetrics.excludedBrightcoveVideoIds').slice();
        if (toggled) {
          excludedIds.push(video.id)
        } else {
          excludedIds = excludedIds.filter((id) => id !== video.id);
        }
        const variables = { input: { id: this.get('model.id'), excludedIds } };
        await this.get('apollo').mutate({ mutation: videoMetricsExcludedBrightcoveVideoIds, variables }, 'campaign');
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
        await this.get('apollo').mutate({ mutation: videoMetricsCampaignStatus, variables }, 'campaign');
        this.get('notify').info('Campaign status set successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    }
  },
});
