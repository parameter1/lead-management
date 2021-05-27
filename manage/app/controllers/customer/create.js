import Controller from '@ember/controller';
import { get } from '@ember/object';
import { inject } from '@ember/service';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import mutation from 'leads-manage/gql/mutations/create-customer';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  actions: {
    async create() {
      try {
        this.startAction();
        const model = this.get('model');
        const payload = {
          name: model.name,
          description: model.description,
          website: model.website,
          parentId: get(model.parent || {}, 'id') || null,
          gamAdvertiserIds: model.linkedAdvertisers.googleAdManager.nodes.map((advertiser) => advertiser.id),
        };
        const variables = { input: { payload } };
        const response = await this.get('apollo').mutate({ mutation, variables }, 'createCustomer');
        await this.transitionToRoute('customer.edit', response.id);
        this.get('notify').info('Customer created successfully.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
