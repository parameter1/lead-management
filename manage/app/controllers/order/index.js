import ListController from '../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' },
      { key: 'fullName', label: 'Name' },
    ]);
    this.set('sortBy', 'updatedAt');

    this.set('searchFields', [
      { key: 'fullName', label: 'Name' },
    ]);
    this.set('searchBy', 'fullName');
  },
});
