import Component from '@ember/component';

export default Component.extend({

  tagName: 'select',
  attributeBindings: ['disabled', 'name'],
  classNames: ['custom-select'],

  disabled: false,

  name: null,
  value: null,

  onChange() { },

  change(event) {
    let value = event.target.value;
    this.set('value', value);
    const onChange = this.get('onChange');
    if ('function' === typeof onChange) {
      onChange(value);
    }
  },
});
