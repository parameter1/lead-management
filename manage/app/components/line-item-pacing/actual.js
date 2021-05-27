import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/template';
import round from 'leads-manage/utils/round';

export default Component.extend({
  classNames: ['pacing-bar-actual'],
  classNameBindings: ['typeClass'],
  attributeBindings: ['style'],

  style: computed('value', function() {
    const value = round(this.get('value') * 100, 4);
    return htmlSafe(`width: ${value >= 100 ? '100' : value}%;`);
  }),

  typeClass: computed('type', function() {
    return `pacing-bar-actual-${this.get('type')}`;
  }),
});
