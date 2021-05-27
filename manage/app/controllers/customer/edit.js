import Controller from '@ember/controller';
import { computed, get } from '@ember/object';
import { inject } from '@ember/service';
import ActionMixin from 'leads-manage/mixins/action-mixin';

import deleteCustomer from 'leads-manage/gql/mutations/delete-customer';
import updateCustomer from 'leads-manage/gql/mutations/update-customer';

export default Controller.extend(ActionMixin, {
  apollo: inject(),

  isSaveDisabled: computed('model.externalSource.identifier', 'isActionRunning', function() {
    // if (this.get('isActionRunning')) return true;
    // if (this.get('model.externalSource.identifier')) return true;
    return false;
  }),

  actions: {
    /**
     *
     */
    async update() {
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
        const input = { id: model.id, payload };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: updateCustomer, variables }, 'updateCustomer');

      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },

    /**
     *
     */
    async delete() {
      try {
        this.startAction();
        const variables = { input: { id: this.get('model.id') } };
        await this.get('apollo').mutate({ mutation: deleteCustomer, variables }, 'deleteCustomer');
        await this.transitionToRoute('customer.list');
        this.get('notify').info('Customer successfully deleted.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
