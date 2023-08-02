import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', []);
    this.set('sortBy', 'omeda.SentDate');
    this.set('ascending', true);
    this.set('showAdvertiserCTOR', null);
    this.set('showTotalAdClicksPerDay', null);
  },
});
