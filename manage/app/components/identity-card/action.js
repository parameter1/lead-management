import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'a',
  classNames: ['dropdown-item', 'clickable'],
  classNameBindings: ['_activeClass'],
  attributeBindings: ['href'],

  href: '#',
  labelSuffix: null,
  inactive: false,

  click(event) {
    event.preventDefault();
    this.get('on-click')();
  },

  _label: computed('inactive', 'labelSuffix', function() {
    let prefix = 'Deactivate';
    if (this.get('inactive')) {
      prefix = `${prefix}d`;
    }
    return `${prefix} ${this.get('labelSuffix')}`;
  }),

  _activeClass: computed('inactive', function() {
    return this.get('inactive') ? 'active' : null;
  }),
});
