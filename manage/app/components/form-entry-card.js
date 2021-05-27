import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed, get } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import activateMutation from 'leads-manage/gql/mutations/form-entry-activate';
import deactivateMutation from 'leads-manage/gql/mutations/form-entry-deactivate';

export default Component.extend(ComponentQueryManager, LoadingMixin, {
  classNameBindings: ['_getColumnClasses'],

  canEdit: true,
  fullWidth: false,
  showTitle: false,
  showEntryNo: true,

  notify: inject(),

  _getColumnClasses: computed('fullWidth', function() {
    if (this.get('fullWidth')) {
      return 'col-12';
    }
    return 'col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3';
  }),

  _filteredFields: computed('form.fields.@each.ID', function() {
    return this.get('form.fields').filter((field) => {
      const id = get(field, 'ID') || '';
      return 0 === id.indexOf('Field');
    });
  }),

  actions: {
    toggleActivation() {
      this.showLoading();
      this.toggleProperty('entry.inactive');
      const mutation = this.get('entry.inactive') ? deactivateMutation : activateMutation;
      const resultKey = this.get('entry.inactive') ? 'formEntryDeactivate' : 'formEntryActivate';

      const id = this.get('entry.id');
      const input = { id };
      const variables = { input };

      return this.get('apollo').mutate({ mutation, variables }, resultKey)
        .then(() => this.get('notify').info('Form entry updated.'))
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.hideLoading())
      ;
    },
  },
});
