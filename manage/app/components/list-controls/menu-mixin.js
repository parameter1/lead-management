import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

export default Mixin.create({
  /**
   * The dropdown menu direction.
   * An empty value will use the default `down` direction.
   * Can be one of `up`, `right` or `left`.
   * @public
   * @type {string}
   */
  direction: null,

  /**
   * Aligns the menu.
   * An empty value will use the default `left` alignment.
   * A value of `right` will right-align the menu.
   * @public
   * @type {string}
   */
  alignment: null,

  /**
   * Determines the menu direction class based off the `direction` property.
   */
  directionClass: computed('direction', function() {
    switch (this.get('direction')) {
      case 'up':
        return 'dropup';
      case 'left':
        return 'dropleft';
      case 'right':
        return 'dropright';
      default:
        return '';
    }
  }),

  /**
   * Determines the menu alignment class based off the `alignment` property.
   */
  alignmentClass: computed('alignment', function() {
    if (this.get('alignment') === 'right') return 'dropdown-menu-right';
    return '';
  }),
});
