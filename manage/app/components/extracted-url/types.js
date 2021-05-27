import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject } from '@ember/service';

export default Component.extend({
  classNames: ['form-inline'],

  selected: null,

  linkTypes: inject(),
  options: computed('linkTypes.types.[]', function() {
    return this.get('linkTypes.types');
  }),
});
