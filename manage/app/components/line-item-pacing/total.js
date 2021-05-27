import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['pacing-bar-total'],
  classNameBindings: ['typeClass'],

  typeClass: computed('type', function() {
    return `pacing-bar-total-${this.get('type')}`;
  }),
});
