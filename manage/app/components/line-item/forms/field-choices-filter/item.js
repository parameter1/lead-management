import Component from '@ember/component';
import { computed } from '@ember/object';

const { isArray } = Array;

export default Component.extend({
  title: null,

  fieldId: null,

  field: computed('fields.@each.fieldId', 'fieldId', function() {
    const fields = this.get('fields');
    if (!isArray(fields)) return {};
    const field = fields.find(f => f.id === this.get('fieldId'));
    return field || {};
  }),

  options: computed('field.choices.[]', function() {
    const choices = this.get('field.choices');
    return isArray(choices) ? choices : [];
  }),

  actions: {
    handleChange(selected) {
      this.set('selected', selected);
      this.get('onChange')(selected);
    }
  },
});
