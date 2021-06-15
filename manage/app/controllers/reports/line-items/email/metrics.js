import ListController from 'leads-manage/controllers/abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('sortBy', 'omeda.SentDate');
    this.set('ascending', true);
  },
});
