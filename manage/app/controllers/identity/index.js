import ListController from '../abstract-list';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { get } from '@ember/object';
import { ObjectQueryManager } from 'ember-apollo-client';

import identityActivation from 'leads-manage/gql/mutations/identity/activation';

export default ListController.extend(FormMixin, ObjectQueryManager, {
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'updatedAt', label: 'Updated' },
      { key: 'createdAt', label: 'Created' },
      { key: 'emailAddress', label: 'Email' },
      { key: 'givenName', label: 'First Name' },
      { key: 'familyName', label: 'Last Name' },
    ]);
    this.set('sortBy', 'updatedAt');
    this.set('ascending', false);

    this.set('searchFields', [
      { key: 'emailAddress', label: 'Email' },
      { key: 'givenName', label: 'First Name' },
      { key: 'familyName', label: 'Last Name' },
      { key: 'externalSource.identifier', label: 'ExactTarget ID' },
    ]);
    this.set('searchBy', 'emailAddress');
  },

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
