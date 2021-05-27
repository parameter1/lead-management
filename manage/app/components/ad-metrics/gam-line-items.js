import Component from '@ember/component';

const { isArray } = Array;

export default Component.extend({
  classNames: ['card'],
  init() {
    this._super(...arguments);
    if (!isArray(this.get('linkedAdvertisers'))) this.set('linkedAdvertisers', []);
    if (!isArray(this.get('lineItems'))) this.set('lineItems', []);
    if (!isArray(this.get('excludedIds'))) this.set('excludedIds', []);
  },

  disabled: false,
});
