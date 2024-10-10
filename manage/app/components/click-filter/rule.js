import Component from '@ember/component';

export default Component.extend({
  actions: {
    setAllowedCodes(codes) {
      this.set('model.allowUnrealCodes', [...codes].sort((a, b) => a - b));
    },
  },
});
