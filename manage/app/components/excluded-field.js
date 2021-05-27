import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'div',
  classNames: ['custom-control', 'custom-checkbox'],
  index: null,

  _checked: computed('field.key', 'excluded.[]', function() {
    const found = this.get('excluded').find((item) => {
      return item === this.get('field.key');
    });
    return (found) ? true : false;
  }),

  actions: {
    toggle() {
      const key = this.get('field.key');
      if (!this.get('_checked')) {
        this.get('excluded').pushObject(key);
      } else {
        this.get('excluded').removeObject(key);
      }
    },
  },
});
