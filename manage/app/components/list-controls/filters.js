import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['btn-group'],
  attributeBindings: ['role', 'aria-label'],

  role: 'group',
  'aria-label': 'Display Result Filters',

  isDisabled: computed('enabled', 'disabled', function() {
    if (!this.get('enabled')) return true;
    return this.get('disabled');
  }),

  /**
   * The class to apply to buttons within this group
   * @public
   * @type {string}
   */
  buttonClass: 'btn-primary',

  /**
   * Whether filters are completely enabled.
   * @public
   * @type {boolean}
   */
  enabled: false,

  /**
   * Whether the filters are currently in a disabled state.
   * @public
   * @type {boolean}
   */
  disabled: false,

  /**
   * The number of active filters
   * @public
   * @type {number}
   */
  activeFilterCount: 0,

  /**
   * Whether the filters are currently being display in the container component.
   * @private
   * @type {boolean}
   */
  isOpen: false,

  init() {
    this._super(...arguments);
    if (!this.get('onClick')) this.set('onClick', () => {});
  },

  actions: {
    onClick() {
      this.toggleProperty('isOpen');
      this.onClick(this.get('isOpen'));
    },
  },
});
