import IdentityListController from 'leads-manage/controllers/identity-list';

export default IdentityListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('first', 40);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);
  },
});
