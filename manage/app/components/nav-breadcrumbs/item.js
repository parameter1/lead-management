import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'li',
  classNames: ['breadcrumb-item'],
  classNameBindings: ['active'],
  attributeBindings: ['aria-current'],

  active: false,
  'aria-current': computed('active', function() {
    if (this.get('active')) return 'page';
    return null;
  }),
});
