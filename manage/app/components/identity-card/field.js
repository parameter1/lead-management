import Component from '@ember/component';

export default Component.extend({
  tagName: 'p',
  classNames: ['mb-0'],
  classNameBindings: ['inline:d-inline'],
  key: null,
  label: null,
  value: null,
  inline: false,
});
