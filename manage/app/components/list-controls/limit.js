import Component from '@ember/component';
import { computed } from '@ember/object';
import MenuMixin from 'leads-manage/components/list-controls/menu-mixin';

export default Component.extend(MenuMixin, {
  classNames: ['btn-group'],
  attributeBindings: ['role', 'aria-label'],

  role: 'group',
  'aria-label': 'Display Limit Filter',

  /**
   * The limit number, e.g. `25`.
   * @public
   * @type {number}
   */
  limit: null,

  /**
   * The label to display before the limit number.
   * @public
   * @type {string}
   */
  label: 'Show:',

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
   * Displays filtered limit options by removing the currently selected `limit` value.
   */
  filteredOptions: computed('options', 'limit', function() {
    return this.get('options').reject(item => item === this.get('limit'));
  }),

  actions: {
    setLimit(value) {
      this.set('limit', value);
    },
  },
});
