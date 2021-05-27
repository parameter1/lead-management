import ListController from '../../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'ranAt', label: 'Time Ran' },
    ]);
    this.set('sortBy', 'ranAt');

    this.set('searchFields', [
      { key: 'name', label: 'Name' },
    ]);
    this.set('searchBy', 'name');
  },
});
