import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed, observer } from '@ember/object';
import { ComponentQueryManager } from 'ember-apollo-client';

import query from 'leads-manage/gql/queries/lead-report/email-metrics';

export default Component.extend(ComponentQueryManager, {
  graphErrors: inject(),

  classNames: ['list-group-item'],
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  didError: computed('errorMessage.length', function() {
    return this.get('errorMessage.length') ? true : false;
  }),
  hasLoaded: false,

  sortBy: 'omeda.SentDate',
  ascending: true,

  didSortChange: observer('sortBy', 'ascending', function() {
    this.refresh();
  }),

  init() {
    this._super(...arguments);
    this.load();
  },

  query() {
    const sort = { field: this.sortBy, order: this.ascending ? 1 : -1 };
    const variables = { hash: this.get('item.hash'), sort };
    return this.get('apollo').watchQuery({ query, variables }, 'reportEmailMetrics');
  },

  async load() {
    try {
      this.set('hasLoaded', false);
      this.set('isLoading', true);

      const data = await this.query();
      this.set('data', data);
      this.set('hasLoaded', true);
    } catch (e) {
      const { message } = this.get('graphErrors').handle(e);
      this.set('errorMessage', message);
    } finally {
      this.set('isLoading', false);
    }
  },

  async refresh() {
    try {
      this.set('isRefreshing', true);
      const data = await this.query();
      this.set('data', data);
    } catch (e) {
      const { message } = this.get('graphErrors').handle(e);
      this.set('errorMessage', message);
    } finally {
      this.set('isRefreshing', false);
    }
  },
});
