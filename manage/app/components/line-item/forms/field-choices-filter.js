import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

import query from 'leads-manage/gql/queries/form/field-choices-filter';

export default Component.extend({
  apollo: inject(),
  graphErrors: inject(),

  classNames: ['card'],

  title: 'Include leads when...',
  filters: null,
  isLoading: false,

  formId: null, // required

  disabled: computed.or('isLoading'),

  init() {
    this._super(...arguments);
    this.set('fields', []);
    this.load();
  },

  async load() {
    try {
      this.set('isLoading', true);
      const id = this.get('formId');
      if (id) {
        const variables = { id };
        const { wufooFields } = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'cache-and-network' }, 'form');
        this.set('fields', wufooFields);
      } else {
        this.set('fields', []);
      }
    } catch(e) {
      this.get('graphErrors').show(e);
    } finally {
      this.set('isLoading', false);
    }
  },

  actions: {
    addFilter(field) {
      this.get('filters').pushObject({
        fieldId: field.id,
        title: field.title,
        choices: [],
      });
      this.send('triggerChange');
    },
    removeFilter(index) {
      this.get('filters').removeAt(index);
      this.send('triggerChange');
    },
    triggerChange() {
      const filters = this.get('filters');
      this.get('onChange')(filters.map(filter => ({
        fieldId: filter.fieldId,
        title: filter.title,
        choices: filter.choices,
      })));
    },
  },
});
