import IdentityListController from 'leads-manage/controllers/identity-list';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default IdentityListController.extend({
  identityAttributes: inject(),

  fields: computed('excludeFields.[]', function() {
    return this.get('identityAttributes').getFilteredFields(this.get('excludeFields'));
  }),

  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('first', 40);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);
  },
});
