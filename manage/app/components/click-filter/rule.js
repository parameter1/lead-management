import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  minutes: computed('model.seconds', {
    get() {
      return (this.get('model.seconds') || 0) / 60;
    },
    set(_, value) {
      this.set('model.seconds', value * 60);
    },
  }),

  actions: {
    setAllowedCodes(codes) {
      this.set('model.allowUnrealCodes', [...codes].sort((a, b) => a - b));
    },
  },
});
