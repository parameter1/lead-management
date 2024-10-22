import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject } from '@ember/service';

export default Component.extend({
  /**
   *
   */
  unrealCodes: inject(),

  labels: computed('selected.[]', function() {
    return this.get('unrealCodes').convertCodesToOptions(this.get('selected'));
  }),
});
