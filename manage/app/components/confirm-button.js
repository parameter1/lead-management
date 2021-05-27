import Component from '@ember/component';

export default Component.extend({
  tagName: 'button',
  classNames: ['btn', 'clickable'],
  attributeBindings: ['disabled', 'type'],

  disabled: false,
  type: 'button',

  icon: '',
  label: 'Action',
  confirmLabel: 'You Sure?',
  onConfirm: null,

  hasConfirmed: false,

  click() {
    if (this.get('hasConfirmed')) {
      this.get('onConfirm')();
    } else {
      this.set('hasConfirmed', true);
    }
  },

  focusOut() {
    this.set('hasConfirmed', false);
  },
});
