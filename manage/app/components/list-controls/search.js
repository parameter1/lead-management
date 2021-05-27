import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'form',

  submit(event) {
    event.preventDefault();
    event.stopPropagation();
    const onSubmit = this.get('onSubmit');
    if (onSubmit) onSubmit(this.get('value'));
  },

  hasSearchType: computed.bool('searchType'),

  searchTypeDisabled: computed.not('hasSearchType'),

  /**
   * The search type.
   * E.g. `contains` or `starts-with`
   */
  searchType: null,

  /**
   * The field to search against.
   */
  searchBy: null,

  /**
   * The initial search phrase input value.
   * This component will *not* directly manipulate this value.
   * Instead, the new value can be retrieve when the search control is submitted.
   * @public
   * @type {string}
   */
  phrase: null,

  /**
   * The icon to display in the search button.
   * @public
   * @type {string}
   */
  icon: 'magnifying-glass',

  /**
   * The label to display in the search button.
   * @public
   * @type {string}
   */
  label: null,

  /**
   * The search field placeholder value.
   * @public
   * @type {string}
   */
  placeholder: 'Search...',

  /**
   * Whether to select all of the text in the search box when focusd.
   * @public
   * @type {boolean}
   */
  selectAllOnFocus: true,

  /**
   * Whether the search control is completely disabled.
   * @public
   * @type {boolean}
   */
  disabled: false,

  /**
   * The class to apply to buttons within this control.
   * @public
   * @type {string}
   */
  buttonClass: 'btn-primary',

  init() {
    this._super(...arguments);
    this.set('value', this.get('phrase'));
  },

  actions: {
    selectAll(event) {
      if (this.get('selectAllOnFocus')) event.target.select();
    },
    clear() {
      this.set('value', '');
      const onSubmit = this.get('onSubmit');
      if (onSubmit) onSubmit('');
    },
  },
});
