import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);

    this.set('sortOptions', [
      { key: 'lastCrawledDate', label: 'Crawled' },
      { key: 'title', label: 'Title' },
      { key: 'values.resolved', label: 'Redireted URL' },
      { key: 'values.original', label: 'Original URL' },
    ]);
    this.set('sortBy', 'lastCrawledDate');
    this.set('ascending', false);

    this.set('searchFields', [
      { key: 'title', label: 'Title' },
      { key: 'values.resolved', label: 'Redireted URL' },
      { key: 'values.original', label: 'Original URL' },
    ]);
    this.set('searchBy', 'values.resolved');
  },
});
