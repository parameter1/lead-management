import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject } from '@ember/service';

export default Component.extend({
  /**
   *
   */
  unrealCodes: inject(),

  isEditing: false,

  minutes: computed('model.seconds', {
    get() {
      if (this.get('model.seconds') == null) return null;
      return (this.get('model.seconds') || 0) / 60;
    },
    set(_, value) {
      this.set('model.seconds', value * 60);
    },
  }),

  codesText: computed('model.allowUnrealCodes.[]', function() {
    const codes = this.get('model.allowUnrealCodes');
    return [...codes].sort((a, b) => a - b).join(', ');
  }),

  emitOnChange() {
    if (typeof this.onChange === 'function') this.onChange();
  },

  actions: {
    setAllowedCodes(options) {
      this.set('model.allowUnrealCodes', this.get('unrealCodes').convertOptionsToCodes(options));
      this.emitOnChange();
    },
  },
});
