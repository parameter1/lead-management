import Component from '@ember/component';
import { inject } from '@ember/service';
import { ComponentQueryManager } from 'ember-apollo-client';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

import updateCurrentUserProfile from 'leads-manage/gql/mutations/update-current-user-profile';

export default Component.extend(LoadingMixin, ComponentQueryManager, {
  session: inject(),

  isUpdateProfileOpen: false,
  isChangePasswordOpen: false,

  actions: {
    displayChangePassword() {
      this.set('isChangePasswordOpen', true);
    },
    logout() {
      this.showLoading();
      this.get('session').invalidate().finally(() => this.hideLoading());
    },
    displayUpdateProfile() {
      this.set('isUpdateProfileOpen', true);
    },
    saveProfile() {
      this.showLoading();
      const mutation = updateCurrentUserProfile;
      const { givenName, familyName } = this.get('model');
      const input = { givenName, familyName };
      const variables = { input };
      return this.get('apollo').mutate({ mutation, variables }, 'updateCurrentUserProfile')
        .then(() => {
          this.set('isUpdateProfileOpen', false);
          this.get('notify').success('User profile successfully updated.');
        })
        .catch(e => this.get('graphErrors').show(e))
        .finally(() => this.hideLoading())
      ;
    },
  },

});
