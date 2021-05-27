import Component from '@ember/component';

export default Component.extend({
  classNames: ['card', 'border-0', 'z-depth-half', 'h-100'],
  isLoading: false,

  rate: 0,
  total: 0,
});
