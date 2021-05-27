import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  value: null,
  label: null,
  selectValue: null,
  tagName: 'option',
  disabled: false,
  attributeBindings: ['selected', 'value', 'disabled'],

  selected: computed('selectValue', function() {
    return this.get('value') === this.get('selectValue');
  }),

  didReceiveAttrs() {
    if (!this.get('label')) {
      this.set('label', this.get('value'));
    }
  }
});
