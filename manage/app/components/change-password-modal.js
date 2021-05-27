import Component from '@ember/component';
import { computed } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';

import changeUserPassword from 'leads-manage/gql/mutations/change-user-password';

export default Component.extend(ComponentQueryManager, {
  model: null,

  isChangePasswordOpen: false,
  canChangePassword: computed('reasonForPreventChange', function() {
    return (!this.get('reasonForPreventChange')) ? true : false;
  }),

  reasonForPreventChange: computed('password.{value,confirm}', function() {
    if (!this.get('password.value.length') || this.get('password.value.length') < 6) {
      return 'supply a new password of at least six characers.';
    }
    if (this.get('password.value') === this.get('password.confirm')) {
      return null;
    }
    return 'please confirm your password with the same value.';
  }),

  didInsertElement() {
    this.set('password', { value: '', confirm: '' });
  },

  actions: {
    changePassword() {
      const mutation = changeUserPassword;
      const id = this.get('model.id');
      const { value, confirm } = this.get('password');
      const input = { id, value, confirm };
      const variables = { input };
      return this.get('apollo').mutate({ mutation, variables }, 'changeUserPassword')
        .then(() => {
          this.set('isChangePasswordOpen', false);
          this.get('notify').success('Password successfully changed.');
        })
        .catch(e => this.get('graphErrors').show(e))
      ;
    },

    clearPassword() {
      this.set('password', { value: '', confirm: '' });
    },
  },

});
