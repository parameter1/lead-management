import Component from '@ember/component';
import { ComponentQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

import activateMutation from 'leads-manage/gql/mutations/form-entry-activate';
import deactivateMutation from 'leads-manage/gql/mutations/form-entry-deactivate';

export default Component.extend(ComponentQueryManager, FormMixin, {
  classNames: ['col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3'],

  canEdit: true,
  showTitle: false,
  showEntryNo: true,

  init() {
    this._super(...arguments);
    this.endAction();
  },

  actions: {
    async toggleActivation() {
      try {
        this.startAction();
        this.toggleProperty('entry.inactive');
        const mutation = this.get('entry.inactive') ? deactivateMutation : activateMutation;
        const resultKey = this.get('entry.inactive') ? 'formEntryDeactivate' : 'formEntryActivate';

        const id = this.get('entry.id');
        const input = { id };
        const variables = { input };
        await this.get('apollo').mutate({ mutation, variables, refetchQueries: ['EditFormLineItemLeads'] }, resultKey);
        this.get('notify').info('Form entry updated.');
      } catch(e) {
        this.get('graphErrors').show(e);
      } finally {
        if (!this.get('isDestroyed')) this.endAction();
      }
    },
  },
});
