import Component from '@ember/component';

export default Component.extend({
  tagName: 'a',

  classNames: ['clickable', 'btn', 'btn-info'],
  attributeBindings: ['href'],

  href: '#',

  key: '',
  toggleState: null,
  label: '',

  init() {
    this._super(...arguments);
    this.set('initialToggleState', this.get('toggleState'));
  },

  click(event) {
    event.preventDefault();
    this.toggleProperty('toggleState');
  },
});
