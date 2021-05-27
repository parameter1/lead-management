import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { get } from '@ember/object';
import { inject } from '@ember/service';

import mutation from 'leads-manage/gql/mutations/ad-creative-tracker/create';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  actions: {
    async create(closeModal) {
      this.startAction();
      const { customer, tags, url, description } = this.get('model');
      const payload = {
        customerId: get(customer, 'id'),
        tagIds: tags.map(tag => tag.id),
        url,
        description,
      };
      const input = { payload };
      const variables = { input };
      const refetchQueries = ['ListAdCreativeTrackers', 'SearchAdCreativeTrackers'];

      try {
        const response = await this.get('apollo').mutate({ mutation, variables, refetchQueries }, 'createAdCreativeTracker');
        await closeModal(false);
        await this.transitionToRoute('link.tracking.ad-creatives.edit', response.id);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
