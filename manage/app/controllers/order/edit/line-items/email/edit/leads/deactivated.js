import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { computed } from '@ember/object';
import { inject } from '@ember/service';

export default Controller.extend(FormMixin, {
  identityAttributes: inject(),
  isLoading: computed.or('loadingDisplay.isShowing', 'isActionRunning'),

  queryParams: null,

  id_first: 20,

  id_phrase: '',
  id_searchType: 'contains',
  id_searchBy: 'name',

  id_sortBy: null,
  id_ascending: false,

  isSortDisabled: computed('id_phrase.length', function() {
    return this.get('id_phrase.length') > 0;
  }),

  hasSearched: computed('id_phrase.length', function() {
    return this.get('id_phrase.length') > 0;
  }),

  refetchQueries: computed('hasSearched', function() {
    if (this.get('hasSearched')) return ['EditEmailLineItemSearchInactiveLeads'];
    return ['EditEmailLineItemInactiveLeads'];
  }),

  init() {
    this._super(...arguments);
    this.set('queryParams', ['id_first', 'id_sortBy', 'id_ascending', 'id_phrase', 'id_searchType', 'id_searchBy']);

    const sortOptions = this.get('identityAttributes.getViewableFields').slice();

    this.set('limitOptions', [10, 20, 50, 100, 200]);
    this.set('sortOptions', [
      { key: 'fieldCount', label: 'Quality' },
      { key: 'createdAt', label: 'Created' },
    ].concat(sortOptions));
    this.set('id_first', 50);
    this.set('id_sortBy', 'fieldCount');
    this.set('id_ascending', false);

    this.set('searchFields', this.get('identityAttributes.getViewableFields'));
    this.set('id_searchBy', 'emailAddress');
  },

  actions: {
    search(phrase) {
      this.set('id_phrase', phrase);
    },
  },
});
