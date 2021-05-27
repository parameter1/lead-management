import ListController from '../../abstract-gam-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'ID', label: 'Created' },
      { key: 'LAST_MODIFIED_DATE_TIME', label: 'Updated' },
      { key: 'NAME', label: 'Name' },
    ]);
    this.set('sortField', 'LAST_MODIFIED_DATE_TIME');

    this.set('searchFields', [
      { key: 'NAME', label: 'Name' },
    ]);
    this.set('searchField', 'NAME');
  },
});
