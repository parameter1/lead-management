import IdentityListController from '../../../identity-list';

export default IdentityListController.extend({
  init() {
    this._super(...arguments);
    this.set('first', 50);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);
  },
});
