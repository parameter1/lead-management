import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  identityAttributes: inject(),

  title: 'Exclude Leads Where...',
  filters: null,

  classNames: ['card'],

  actions: {
    addFilter(field) {
      const { key, label } = field;
      this.get('filters').pushObject({ key, label, matchType: 'matches', terms: [] });
      this.send('triggerChange');
    },
    removeFilter(index) {
      this.get('filters').removeAt(index);
      this.send('triggerChange');
    },
    triggerChange() {
      const filters = this.get('filters');
      this.get('on-change')(filters.map((filter) => {
        const { key, label, matchType, terms } = filter;
        return {
          key,
          label,
          matchType,
          terms,
        };
      }));
    },
  },
});
