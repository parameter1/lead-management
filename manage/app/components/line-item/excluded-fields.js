import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

const { isArray } = Array;

export default Component.extend({
  classNames: ['form-group'],

  identityAttributes: inject(),

  options: computed('identityAttributes.getViewableFields', 'excludedFields.[]', function() {
    const selected = this.get('excludedFields');
    return this.get('identityAttributes.getViewableFields').filter(o => !selected.includes(o.key));
  }),

  selected: computed('identityAttributes.getViewableFields', 'excludedFields.[]', function() {
    const selected = this.get('excludedFields');
    return this.get('identityAttributes.getViewableFields').filter(o => selected.includes(o.key));
  }),

  isEditorial: computed('tags.@each.name', 'linkTypes.[]', function() {
    const pr = this.get('tags').find(tag => tag.name === 'PR');
    const editorialLink = this.get('linkTypes').includes('Editorial');
    if (pr || editorialLink) return true;
    return false;
  }),

  init() {
    this._super(...arguments);
    if (!isArray(this.get('tags'))) this.set('tags', []);
    if (!isArray(this.get('linkTypes'))) this.set('linkTypes', []);
  },

  actions: {
    onChange(fields) {
      this.get('onChange')(fields.map(o => o.key));
    },
  },

});
