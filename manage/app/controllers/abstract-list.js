import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  /**
   * Query params
   */
  queryParams: null,

  first: 20,

  phrase: '',
  searchType: 'contains',
  searchBy: 'name',

  sortBy: null,
  ascending: false,

  isSortDisabled: computed('phrase.length', function() {
    return this.get('phrase.length') > 0;
  }),

  init() {
    this._super(...arguments);
    this.set('queryParams', ['first', 'sortBy', 'ascending', 'phrase', 'searchType', 'searchBy']);

    // Should be overriden by the specific controller for different options.
    this.set('searchFields', [
      { key: 'name', label: 'Name' },
    ]);

    // Should be overriden by the specific controller for different options.
    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
    ]);
    this.set('limitOptions', [10, 20, 50, 100, 200]);
    this.set('sortBy', 'createdAt');
  },

  actions: {
    search(phrase) {
      this.set('phrase', phrase);
    },
  },
});
