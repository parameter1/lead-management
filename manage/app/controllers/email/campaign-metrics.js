import ListController from '../abstract-list';
import { computed } from '@ember/object';
import moment from 'moment';

export default ListController.extend({
  center: moment(),

  activeFilterCount: computed('customers.length', 'dateRange.{start,end}', function() {
    let filters = 0;
    if (this.get('customers.length')) filters += 1;
    if (this.get('dateRange.start')) filters += 1;
    if (this.get('dateRange.end')) filters += 1;
    return filters;
  }),

  hasActiveFilters: computed('activeFilterCount', function() {
    return this.get('activeFilterCount') > 0;
  }),

  filtersOpen: false,
  filtersEnabled: true,

  dateRange: computed('rangeStart', 'rangeEnd', function() {
    const { rangeStart, rangeEnd } = this;
    return {
      start: typeof rangeStart === 'string' ? moment(parseInt(rangeStart, 10)) : rangeStart,
      end: typeof rangeEnd === 'string' ? moment(parseInt(rangeEnd, 10)) : rangeEnd,
    }
  }),

  clearButtonDisabled: computed('hasActiveFilters', 'routeLoading', function() {
    return Boolean(!this.get('hasActiveFilters') || this.get('routeLoading'));
  }),

  init() {
    this._super(...arguments);
    this.get('queryParams').pushObject('customers');
    this.get('queryParams').pushObject('rangeStart');
    this.get('queryParams').pushObject('rangeEnd');

    this.set('customers', []);
    const now = new Date();
    const start = moment(now).startOf('week');
    const end = moment(now).endOf('week');
    this.set('defaultRange', { start, end });

    this.set('rangeStart', start);
    this.set('rangeEnd', end);
    this.set('internalRange', { start, end });

    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' },
      { key: 'fullName', label: 'Name' },
    ]);
    this.set('sortBy', 'fullName');
    this.set('ascending', true);
  },

  actions: {
    setCustomers(customers) {
      this.set('customers', customers.map((customer) => ({ id: customer.id, name: customer.name })))
    },

    setRange({ start, end } ) {
      this.set('internalRange', {
        start: start ? moment(start) : null,
        end: end ? moment(end) : null,
      });
      if (!end) return;
      this.set('rangeStart', start);
      this.set('rangeEnd', end);
    },

    clearFilters() {
      this.set('customers', []);
      const { start, end } = this.defaultRange;
      this.set('internalRange', { start, end });
      this.set('rangeStart', start);
      this.set('rangeEnd', end);
    },
  },
});
