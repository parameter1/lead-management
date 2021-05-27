import Controller from '@ember/controller';
import { inject } from '@ember/service';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import link from 'leads-manage/gql/mutations/customer/link-gam-advertiser';
import unlink from 'leads-manage/gql/mutations/gam/advertiser/unlink-customer';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    async link() {
      try {
        this.startAction();
        const customerId = this.get('model.customer.id');
        const advertiserId = this.get('model.id');

        // link advertiser when customer is set, otherwise unlink
        const action = customerId ? 'linked' : 'unlinked';
        const mutation = customerId ? link : unlink;
        const input = customerId ? { customerId, advertiserId } : { advertiserId };
        const resultKey = customerId ? 'linkGAMAdvertiserToCustomer' : 'unlinkGAMAdvertiser';
        const variables = { input };

        await this.get('apollo').mutate({ mutation, variables }, resultKey);
        await this.transitionToRoute('customer.list.gam-advertisers');
        this.get('notify').info(`Advertiser successfully ${action}.`);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
