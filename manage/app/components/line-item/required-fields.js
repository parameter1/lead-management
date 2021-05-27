import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['form-group'],

  identityAttributes: inject(),

  options: computed('identityAttributes.getViewableFields', 'requiredFields.[]', function() {
    const selected = this.get('requiredFields');
    return this.get('identityAttributes.getViewableFields').filter(o => !selected.includes(o.key));
  }),

  selected: computed('identityAttributes.getViewableFields', 'requiredFields.[]', function() {
    const selected = this.get('requiredFields');
    return this.get('identityAttributes.getViewableFields').filter(o => selected.includes(o.key) || o.key === 'emailAddress');
  }),

  actions: {
    onChange(fields) {
      this.get('onChange')(fields.map(o => o.key));
    },
  },
});
