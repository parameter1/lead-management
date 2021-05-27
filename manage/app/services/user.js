import Service, { inject } from '@ember/service';
import { computed } from '@ember/object';
import { ObjectQueryManager } from 'ember-apollo-client';
// import Permissions from 'leads-manage/objects/permissions';

export default Service.extend(ObjectQueryManager, {
  loadingDisplay: inject(),
  session: inject(),
  auth: inject(),

  model: computed.reads('auth.response.user'),

  isAuthenticated: computed.reads('session.isAuthenticated'),

  role: computed('isAuthenticated', 'model.role', function() {
    if (!this.get('isAuthenticated')) return null;
    return this.get('model.role');
  }),

  roleIs(...roles) {
    const role = this.get('role');
    if (!role) return false;
    return roles.includes(role);
  },

  isAdmin: computed('role', function() {
    return this.get('role') === 'Administrator';
  }),

  isMember: computed('role', function() {
    return this.get('role') === 'Member';
  }),

  isAtLeastMember: computed('isAdmin', 'isMember', function() {
    if (this.get('isAdmin')) return true;
    return this.get('isMember');
  }),

  async logout() {
    const loader = this.get('loadingDisplay');
    loader.show();
    try {
      await this.get('session').invalidate();
    } catch (e) {
      this.get('graphErrors').show(e);
    } finally {
      loader.hide();
    }
  }
});
