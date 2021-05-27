import ListController from '../../abstract-list';
import LoadingMixin from 'leads-manage/mixins/loading-mixin';

export default ListController.extend(LoadingMixin, {
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'identifier', label: 'Form ID' },
    ]);
    this.set('sortBy', 'identifier');
    this.set('first', 50);
    this.set('ascending', true);
  },
});
