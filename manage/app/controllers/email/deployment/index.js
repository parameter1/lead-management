import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'externalSource.createdAt', label: 'Created' },
      { key: 'externalSource.updatedAt', label: 'Updated' },
      { key: 'externalSource.lastRetrievedAt', label: 'Last Retrieved' },
      { key: 'name', label: 'Name' },
    ]);
    this.set('sortBy', 'externalSource.createdAt');

    this.set('searchFields', [
      { key: 'name', label: 'Name' },
      { key: 'subject', label: 'Subject' },
    ]);
    this.set('searchBy', 'name');
  },
});
