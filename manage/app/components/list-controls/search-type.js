import Component from '@ember/component';
import { computed } from '@ember/object';
import MenuMixin from 'leads-manage/components/list-controls/menu-mixin';

export default Component.extend(MenuMixin, {
  tagName: 'div',
  classNames: ['btn-group'],

  role: 'group',
  'aria-label': 'Display Search Types',

  init() {
    this._super(...arguments);
    this.set('types', [
      { key: 'contains', label: 'Contains' },
      { key: 'starts-with', label: 'Starts With' },
      { key: 'ends-with', label: 'Ends With' },
      { key: 'exact-match', label: 'Exact Match' },
    ]);
  },

  /**
   * The search option key, e.g. `contains`.
   * @public
   * @type {number}
   */
  type: 'contains',

  /**
   * Whether the limit dropdown control is completely disabled.
   * @public
   * @type {boolean}
   */
  disabled: false,

  /**
   * The class to apply to buttons within this group
   * @public
   * @type {string}
   */
  buttonClass: 'btn-primary',

  /**
   * Based on the `type` value, computes the selected search type.
   * For example, if the `type` value equals `contains`, this would return
   * something like `{ key: 'contains', label: 'Contains' }`.
   */
  selected: computed('types.[]', 'type', function() {
    return this.get('types').findBy('key', this.get('type'));
  }),

  /**
   * Displays filtered search types by removing the currently selected `type` value.
   */
  filteredOptions: computed('types.[]', 'type', function() {
    return this.get('types').rejectBy('key', this.get('type'));
  }),

  actions: {
    setType(value) {
      this.set('type', value);
    },
  },
});
