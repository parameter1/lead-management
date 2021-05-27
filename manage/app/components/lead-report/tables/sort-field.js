import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'a',

  classNames: ['clickable'],
  attributeBindings: ['href'],

  href: '#',

  key: null,
  sortBy: '',
  ascending: false,
  reset: true,

  init() {
    this._super(...arguments);
    this.set('originalSortBy', this.get('sortBy'));
  },

  click(event) {
    event.preventDefault();
    if (this.get('isActive')) {
      if (this.get('reset') && this.get('ascending') === false) {
        this.set('sortBy', this.get('originalSortBy'));
      } else {
        this.toggleProperty('ascending');
      }
    } else {
      this.set('sortBy', this.get('key'));
      this.set('ascending', true);
    }
  },

  isActive: computed('key', 'sortBy', function() {
    return this.get('key') === this.get('sortBy');
  }),
});
