import Component from '@ember/component';

export default Component.extend({
  tagName: 'nav',
  attributeBindings: ['aria-label'],
  wrapperClass: 'breadcrumb h2 border-0 bg-transparent my-1',

  'aria-label': 'breadcrumb',
});
