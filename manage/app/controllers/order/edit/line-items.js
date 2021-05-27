import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' },
      { key: 'name', label: 'Name' },
    ]);
    this.set('sortBy', 'updatedAt');

    this.set('searchFields', [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
    ]);
    this.set('searchBy', 'name');
  },
});
