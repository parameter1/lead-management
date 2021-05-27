import ListController from '../../../abstract-list';
import { inject } from '@ember/service';

export default ListController.extend({
  identityAttributes: inject(),

  init() {
    this._super(...arguments);
    const sortOptions = this.get('identityAttributes.getViewableFields').slice();

    this.set('sortOptions', [
      { key: 'fieldCount', label: 'Quality' },
      { key: 'createdAt', label: 'Created' },
    ].concat(sortOptions));
    this.set('first', 50);
    this.set('sortBy', 'fieldCount');
    this.set('ascending', false);

    this.set('searchFields', this.get('identityAttributes.getViewableFields'));
    this.set('searchBy', 'emailAddress');
  },
});
