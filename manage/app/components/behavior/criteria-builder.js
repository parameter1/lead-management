import Component from '@ember/component';
import { isArray } from '@ember/array';

export default Component.extend({

  didInsertElement() {
    const criteria = this.get('criteria');
    this.set('criteria', isArray(criteria) ? criteria : []);
    this.set('types', ['Company', 'Section', 'Taxonomy']);
  },

  actions: {
    add() {
      this.get('criteria').pushObject({ type: '', items: [], new: true });
    },
    remove(model) {
      this.get('criteria').removeObject(model);
    },
  },
});
