import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'createdAt', label: 'Created' },
      { key: 'updatedAt', label: 'Updated' },
    ]);
    this.set('sortBy', 'updatedAt');

    this.set('searchFields', [
      { key: 'description', label: 'Description' },
      { key: 'url', label: 'URL' },
    ]);
    this.set('searchBy', 'url');
  },
});
