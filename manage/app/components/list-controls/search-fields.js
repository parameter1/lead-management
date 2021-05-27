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
  },

  /**
   * The field to search against, e.g. `name`.
   * @public
   * @type {number}
   */
  searchBy: null,

  /**
   * Whether the dropdown control is completely disabled.
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
   * Based on the `searchBy` value, computes the selected search field.
   * For example, if the `searchBy` value equals `name`, this would return
   * something like `{ key: 'name', label: 'Name' }`.
   */
  selected: computed('fields.[]', 'searchBy', function() {
    return this.get('fields').findBy('key', this.get('searchBy'));
  }),

  actions: {
    setField(value) {
      this.set('searchBy', value);
    },
  },
});
