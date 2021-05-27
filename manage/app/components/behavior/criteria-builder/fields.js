import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject } from '@ember/service';
import { ComponentQueryManager } from 'ember-apollo-client';
import config from 'leads-manage/config/environment';

import behaviorSearchTaxonomy from 'leads-manage/gql/queries/behavior/search-taxonomy';
import behaviorSearchSections from 'leads-manage/gql/queries/behavior/search-sections';
import behaviorSearchCompanies from 'leads-manage/gql/queries/behavior/search-companies';

export default Component.extend(ComponentQueryManager, {
  classNames: ['collapse'],
  attributeBindings: ['data-parent', 'aria-labelledby'],
  classNameBindings: ['show'],

  ohBehaveToken: inject(),

  model: null,

  show: computed('model.id', function() {
    if (this.get('model.id')) return false;
    return true;
  }),

  searchType: computed('model.type', function() {
    const type = this.get('model.type');
    if (!type) return null;
    return `behavior-${type.toLowerCase()}`;
  }),

  searchDisabled: computed('searchType', function() {
    if (this.get('searchType')) return false;
    return true;
  }),

  query: computed('searchType', function() {
    switch (this.get('searchType')) {
      case 'behavior-taxonomy':
        return { query: behaviorSearchTaxonomy, resultKey: 'behaviorSearchTaxonomy' };
      case 'behavior-section':
        return { query: behaviorSearchSections, resultKey: 'behaviorSearchSections' };
      case 'behavior-company':
      return { query: behaviorSearchCompanies, resultKey: 'behaviorSearchCompanies' };
    }
  }),

  actions: {
    async search(phrase) {
      const { query, resultKey } = this.get('query');
      const { propertyId } = config.behaviorAPI;
      const variables = { propertyId, phrase };

      const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
      const context = { ohBehaveToken };

      return this.get('apollo').watchQuery({ query, variables, context }, resultKey)
        .catch(e => this.get('graphErrors').show(e))
      ;
    },
    setType(type) {
      this.set('model.type', type);
      this.set('model.items', []);
    },
  },
});
