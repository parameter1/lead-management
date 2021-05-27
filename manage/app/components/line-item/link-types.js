import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['form-group'],

  linkTypeService: inject('link-types'),

  options: computed('linkTypeService.types', 'linkTypes', function() {
    const selected = this.get('linkTypes');
    return this.get('linkTypeService.types').filter(type => !selected.includes(type));
  }),

  actions: {
    onChange(linkTypes) {
      this.get('onChange')(linkTypes);
    },
  },

});
