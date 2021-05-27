import Component from '@ember/component';
import { computed } from '@ember/object';

const { isArray } = Array;

export default Component.extend({
  tagName: 'li',
  classNames: ['list-group-item', 'd-flex', 'align-items-center'],
  init() {
    this._super(...arguments);
    if (!isArray(this.get('excludedIds'))) this.set('excludedIds', []);
  },

  disabled: false,

  isExcluded: computed('excludedIds.[]', 'video.id', function() {
    return this.get('excludedIds').includes(this.get('video.id'));
  }),

  checked: computed.not('isExcluded'),
});
