import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import mutation from 'leads-manage/gql/mutations/campaign/email/click-rules';

export default Component.extend(ComponentQueryManager, ActionMixin, {
  user: inject(),

  title: 'Custom Click Filter Rules',

  touched: false,

  show: computed.reads('user.isAdmin'),

  actions: {
    remove(rule) {
      this.get('rules').removeObject(rule);
      this.set('touched', true);
    },

    add() {
      this.get('rules').pushObject({ allowUnrealCodes: [] });
      this.set('touched', true);
    },

    async save() {
      this.startAction();
      try {

        const input = {
          id: this.get('campaignId'),
          rules: this.get('rules').map((rule) => ({
            codes: rule.allowUnrealCodes || [],
            seconds: rule.seconds || 0,
          })),
        };

        await this.get('apollo').mutate({ mutation, variables: { input } }, 'emailCampaignClickRules');
        this.set('touched', false);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
