import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  mergedTags: computed.union('item.tags', 'item.host.tags'), // eslint-disable-line
  uniqueTags: computed.uniqBy('mergedTags', 'id'),

  activeCustomer: computed('item.{customer.id,host.customer.id}', function() {
    if (this.get('item.customer.id')) return this.get('item.customer');
    return this.get('item.host.customer');
  }),

  hasAssignments: computed('assignmentCount', function() {
    return this.get('assignmentCount') > 0;
  }),

  assignmentCount: computed('activeCustomer.id', 'mergedTags.length', function() {
    let count = 0;
    if (this.get('activeCustomer.id')) count += 1;
    count += this.get('mergedTags.length');
    return count;
  }),
});
