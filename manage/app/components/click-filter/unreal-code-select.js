import Component from '@ember/component';

export default Component.extend({
  init() {
    this._super(...arguments);
    this.set('options', [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]);
  },
});
