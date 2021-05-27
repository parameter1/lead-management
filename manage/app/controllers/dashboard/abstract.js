import ListController from 'leads-manage/controllers/abstract-list';
import { computed } from '@ember/object';
import moment from 'moment';

export default ListController.extend({
  startingCenter: moment(),
  endingCenter: moment(),

  activeFilterCount: computed('customers.length', 'salesReps.length', 'starting.{start,end}', 'ending.{start,end}', function() {
    let filters = 0;
    if (this.get('customers.length')) filters += 1;
    if (this.get('salesReps.length')) filters += 1;
    if (this.get('starting.start') || this.get('starting.end')) filters += 1;
    if (this.get('ending.start') || this.get('ending.end')) filters += 1;
    return filters;
  }),

  hasActiveFilters: computed('activeFilterCount', function() {
    return this.get('activeFilterCount') > 0;
  }),

  filtersOpen: false,
  filtersEnabled: true,

  starting: computed('startingBefore', 'startingAfter', function() {
    const { startingBefore, startingAfter } = this;
    return {
      end: typeof startingBefore === 'string' ? moment(parseInt(startingBefore, 10)) : startingBefore,
      start: typeof startingAfter === 'string' ? moment(parseInt(startingAfter, 10)) : startingAfter,
    }
  }),

  ending: computed('endingBefore', 'endingAfter', function() {
    const { endingBefore, endingAfter } = this;
    return {
      end: typeof endingBefore === 'string' ? moment(parseInt(endingBefore, 10)) : endingBefore,
      start: typeof endingAfter === 'string' ? moment(parseInt(endingAfter, 10)) : endingAfter,
    }
  }),

  clearButtonDisabled: computed('hasActiveFilters', 'routeLoading', function() {
    return Boolean(!this.get('hasActiveFilters') || this.get('routeLoading'));
  }),

  init() {
    this._super(...arguments);
    this.get('queryParams').pushObject('customers');
    this.get('queryParams').pushObject('salesReps');
    this.get('queryParams').pushObject('startingAfter');
    this.get('queryParams').pushObject('startingBefore');
    this.get('queryParams').pushObject('endingAfter');
    this.get('queryParams').pushObject('endingBefore');

    this.set('customers', []);
    this.set('salesReps', []);

    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' },
      { key: 'name', label: 'Name' },
    ]);
    this.set('sortBy', 'updatedAt');

    this.set('searchFields', [
      { key: 'name', label: 'Name' },
    ]);
    this.set('searchBy', 'name');
  },

  actions: {
    setCustomers(customers) {
      this.set('customers', customers.map((customer) => ({ id: customer.id, name: customer.name })))
    },

    setSalesReps(salesReps) {
      this.set('salesReps', salesReps.map((user) => ({ id: user.id, givenName: user.givenName, familyName: user.familyName })))
    },

    setStartingRange(range) {
      this.set('startingBefore', range.end);
      this.set('startingAfter', range.start);
    },

    setEndingRange(range) {
      this.set('endingBefore', range.end);
      this.set('endingAfter', range.start);
    },

    clearFilters() {
      this.set('customers', []);
      this.set('salesReps', []);
      this.set('startingBefore', null);
      this.set('startingAfter', null);
      this.set('endingBefore', null);
      this.set('endingAfter', null);
    },
  },
});
