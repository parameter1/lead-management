import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  label: null,
  terms: null,
  matchType: null,

  options: computed('terms.[]', function() {
    return this.get('terms').map(term => ({ value: term, label: term }));
  }),

  selected: computed('terms.[]', function() {
    return this.get('options');
  }),

  init() {
    this._super(...arguments);
    this.set('matchOptions', [
      { value: 'contains', label: 'Contains' },
      { value: 'matches', label: 'Exactly Matches' },
      { value: 'starts', label: 'Starts With' },
    ]);
  },

  formatTerm(term) {
    return term.trim().toLowerCase();
  },

  sendChange() {
    const terms = this.get('terms');
    const matchType = this.get('matchType');
    this.get('on-change')(matchType, terms);
  },

  actions: {
    setMatchType() {
      this.sendChange();
    },
    addTerm(term) {
      const terms = this.get('terms');
      const formatted = this.formatTerm(term);
      if (formatted) {
        terms.pushObject(formatted);
        this.sendChange();
      }
    },
    destroy() {
      this.get('on-destroy')(this.get('filter'));
    },
    changeTerms(terms) {
      this.set('terms', terms);
      this.sendChange();
    },
  },
});
