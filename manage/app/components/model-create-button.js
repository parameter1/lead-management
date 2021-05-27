import Component from '@ember/component';

export default Component.extend({
  tagName: 'button',
  classNames: ['btn', 'btn-lg', 'btn-success', 'create', 'fixed-bottom', 'float-right'],
  attributeBindings: ['title'],
  icon: '',
  title: 'Create New Record',
});
