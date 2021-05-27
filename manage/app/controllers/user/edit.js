import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  userRoles: inject(),

  isChangePasswordOpen: false,

  actions: {
    displayChangePassword() {
      this.set('isChangePasswordOpen', true);
    },
  },
});
