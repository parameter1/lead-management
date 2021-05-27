import ListController from 'leads-manage/controllers/abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('first', 40);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);
  },
});
