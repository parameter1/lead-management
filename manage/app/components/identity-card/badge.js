import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'span',
  classNames: ['badge', 'badge-pill'],
  classNameBindings: ['_typeClass'],
  inactive: false,
  domainExcluded: false,

  _label: computed('inactive', 'domainExcluded', function() {
    if (this.get('domainExcluded')) return 'Inactive (Domain Excluded)'
    return this.get('inactive') ? 'Inactive' : 'Active';
  }),

  _typeClass: computed('inactive', 'domainExcluded', function() {
    return this.get('inactive') || this.get('domainExcluded') ? 'badge-danger' : 'badge-success';
  }),
});
