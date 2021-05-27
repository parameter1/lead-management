import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  session: inject(),
  hideNav: false,

  displayNav: computed('hideNav', 'session.isAuthenticated', function() {
    if (!this.get('session.isAuthenticated')) {
      return false;
    }
    if (this.get('hideNav')) return false;
    return true;
  }),
});
