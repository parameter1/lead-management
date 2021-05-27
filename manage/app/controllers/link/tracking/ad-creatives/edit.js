import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { get } from '@ember/object';
import { inject } from '@ember/service';

import mutation from 'leads-manage/gql/mutations/ad-creative-tracker/update';

export default Controller.extend(FormMixin, {
  apollo: inject(),

  actions: {
    async update() {
      this.startAction();
      const { id, customer, tags, url, description } = this.get('model');
      const payload = {
        customerId: get(customer, 'id'),
        tagIds: tags.map(tag => tag.id),
        url,
        description,
      };
      const input = {
        id,
        payload,
      };
      const variables = { input };
      const refetchQueries = ['ListAdCreativeTrackers', 'SearchAdCreativeTrackers'];

      try {
        await this.get('apollo').mutate({ mutation, variables, refetchQueries }, 'updateAdCreativeTracker');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
