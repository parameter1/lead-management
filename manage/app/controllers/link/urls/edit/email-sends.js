import ListController from '../../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'sentDate', label: 'Sent' },
      { key: 'externalSource.createdAt', label: 'Created' },
      { key: 'externalSource.updatedAt', label: 'Updated' },
      { key: 'externalSource.lastRetrievedAt', label: 'Last Retrieved' },
      { key: 'name', label: 'Name' },
    ]);
    this.set('sortBy', 'sentDate');

    this.set('searchFields', [
      { key: 'name', label: 'Name' },
      { key: 'subject', label: 'Subject' },
      { key: 'fromName', label: 'From' },
      { key: 'externalSource.identifier', label: 'ExactTarget ID' },
      { key: 'status', label: 'Status' },
    ]);
    this.set('searchBy', 'name');
  },
});
