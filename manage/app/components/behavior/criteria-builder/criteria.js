import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['card'],

  index: 0,
  model: null,
  number: computed('index', function() {
    return this.get('index') + 1;
  }),

  targetId: computed(function() {
    const ts = Date.now();
    return `${ts}`;
  }),

});
