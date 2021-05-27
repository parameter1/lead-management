import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { isPresent } from '@ember/utils';

export default Component.extend({
  classNames: ['card-text', 'mb-2'],
  title: null,

  _isEmpty: computed('identity.@each', 'fields.[]', function() {
    let empty = true;
    this.get('fields').forEach(field => {
      if (isPresent(get(this.get('identity'), field.key))) {
        empty = false;
      }
    });
    return empty;
  }),
});
