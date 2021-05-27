import Component from '@ember/component';
import { computed } from '@ember/object';
import { isArray } from '@ember/array';
import MenuMixin from 'leads-manage/components/list-controls/menu-mixin';

export default Component.extend(MenuMixin, {
  classNames: ['btn-group'],
  attributeBindings: ['role', 'aria-label'],

  role: 'group',
  'aria-label': 'Sort filter',

  /**
   * The sortBy field value, e.g. `createdAt` or `name`.
   * @public
   * @type {string}
   */
  sortBy: null,

  /**
   * Whether the sort is ascending. A false value signifies descending.
   * @public
   * @type {boolean}
   */
  ascending: true,

  /**
   * Whether the sort dropdown control is completely disabled.
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
   * Based on the `sortBy` value, computes the selected sort object.
   * For example, if the `sortBy` value equals `createdAt`, this would return
   * something like `{ key: 'createdAt', label: 'Created' }`.
   */
  selected: computed('options.[]', 'sortBy', function() {
    return this.get('options').findBy('key', this.get('sortBy'));
  }),

  /**
   * Displays filtered sort options by removing the currently selected `sortBy` value.
   * Returns an array of sort option objects.
   */
  filteredOptions: computed('options.[]', 'sortBy', function() {
    return this.get('options').rejectBy('key', this.get('sortBy'));
  }),

  /**
   * Initializes the component.
   * If the `options` property is not an array, it will set it as an empty array.
   */
  init() {
    this._super(...arguments);
    if (!isArray(this.get('options'))) {
      this.set('options', []);
    }
  },

  actions: {
    toggleAscending() {
      this.toggleProperty('ascending');
    },
    sortBy(key) {
      this.set('sortBy', key);
    },
  },
});
