import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/template';
import round from 'leads-manage/utils/round';

export default Component.extend({
  classNames: ['pacing-bar-expected'],

  attributeBindings: ['style'],

  style: computed('value', function() {
    return htmlSafe(`left: ${round(this.get('value') * 100, 4)}%;`);
  }),
});
