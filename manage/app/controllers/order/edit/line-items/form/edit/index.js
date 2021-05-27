import Controller from '@ember/controller';
import { computed } from '@ember/object';

const { isArray } = Array;

export default Controller.extend({
  choiceFilters: computed('model.choiceFilters.[]', function() {
    const filters = this.get('model.choiceFilters');
    if (!isArray(filters)) return [];
    return filters.map((filter) => {
      return `${filter.title} "${filter.choices.join('" or "')}"`;
    });
  }),
});
