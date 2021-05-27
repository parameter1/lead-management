import ListController from 'leads-manage/controllers/abstract-list';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default ListController.extend({
  identityAttributes: inject(),

  fields: computed('excludedFields.[]', function() {
    return this.get('identityAttributes').getFilteredFields(this.get('excludedFields'));
  }),

  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('first', 40);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);
  },
});
