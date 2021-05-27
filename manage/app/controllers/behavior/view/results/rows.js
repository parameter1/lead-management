import ListController from '../../../abstract-list';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

export default ListController.extend(LoadingMixin, {
  init() {
    this._super(...arguments);
    this.set('first', 50);
    this.set('sortOptions', []);
    this.set('sortBy', 'emailAddress');
    this.set('ascending', true);
  },
});
