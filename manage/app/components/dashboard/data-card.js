import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['card', 'border-0', 'z-depth-half', 'h-100'],
  isLoading: false,
  format: '0.00a',
  color: 'primary',

  textColorClass: computed('color', function() {
    return `text-${this.get('color')}`;
  }),

  format2: computed('format', 'secondaryFormat', function() {
    const secondaryFormat = this.get('secondaryFormat');
    if (secondaryFormat) return secondaryFormat;
    return this.get('format');
  }),
  hasSecondaryValue: computed('secondaryValue', function() {
    if (typeof this.get('secondaryValue') === 'number') return true;
    return false;
  }),
});
