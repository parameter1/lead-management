import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  /**
   * Query params
   */
  queryParams: null,

  limit: 20,

  searchPhrase: '',
  searchField: 'name',

  sortField: undefined,
  ascending: false,

  isSortDisabled: computed('searchPhrase.length', function() {
    return this.get('searchPhrase.length') > 0;
  }),

  init() {
    this._super(...arguments);
    this.set('queryParams', ['limit', 'sortField', 'ascending', 'searchPhrase', 'searchField']);

    // Should be overriden by the specific controller for different options.
    this.set('searchFields', [
      { key: 'NAME', label: 'Name' },
    ]);

    // Should be overriden by the specific controller for different options.
    this.set('sortOptions', [
      { key: 'ID', label: 'Created' },
    ]);
    this.set('limitOptions', [10, 20, 50, 100, 200]);
    this.set('sortField', 'ID');
  },

  actions: {
    search(phrase) {
      this.set('searchPhrase', phrase);
    },
  },
});
