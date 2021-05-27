import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  /**
   * Query params
   */
   queryParams: null,

   limit: 20,

   searchPhrase: '',
   searchField: 'NAME',

   sortField: 'UPDATED_AT',
   ascending: false,

   isSortDisabled: computed('searchPhrase.length', function() {
     return this.get('searchPhrase.length') > 0;
   }),

  init() {
    this._super(...arguments);
    this.set('queryParams', ['limit', 'sortField', 'ascending', 'searchPhrase', 'searchField']);

    this.set('limitOptions', [10, 20, 50, 100]);

    this.set('searchFields', [
      { key: 'NAME', label: 'Name' },
    ]);

    this.set('sortOptions', [
      { key: 'CREATED_AT', label: 'Created' },
      { key: 'PUBLISHED_AT', label: 'Published' },
      { key: 'NAME', label: 'Name' },
      { key: 'UPDATED_AT', label: 'Updated' },
    ]);
  },

  actions: {
    search(phrase) {
      this.set('searchPhrase', phrase);
    },
  },
});
