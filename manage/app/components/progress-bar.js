import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['progress'],
  color: 'info',
  backgroundClass: computed('color', function() {
    return `bg-${this.get('color')}`;
  }),
  show: false,
});
