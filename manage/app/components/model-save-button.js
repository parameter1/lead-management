import Component from '@ember/component';

export default Component.extend({
  tagName: 'button',
  classNames: ['btn', 'btn-lg', 'btn-success'],
  attributeBindings: ['disabled', 'type', 'form'],

  disabled: false,
  type: 'submit',

  icon: 'save',
  label: 'Save',

});
