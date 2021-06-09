import IdentityListController from '../identity-list';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { get } from '@ember/object';
import { ObjectQueryManager } from 'ember-apollo-client';

import identityActivation from 'leads-manage/gql/mutations/identity/activation';

export default IdentityListController.extend(FormMixin, ObjectQueryManager, {
  actions: {
    /**
     *
     */
    async toggleGlobalActivation(item) {
      this.startAction();
      const identityId = get(item, 'id');
      const inactive = !get(item, 'inactive');
      const input = { identityId, active: !inactive };
      const variables = { input };

      try {
        await this.get('apollo').mutate({ mutation: identityActivation, variables }, 'identityActivation');
        this.get('notify').info('Global identity activation set.');
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
