import ListController from './abstract-list';
import { inject } from '@ember/service';

export default ListController.extend({
  identityAttributes: inject(),

  init() {
    this._super(...arguments);
    const viewableFields = this.get('identityAttributes.getViewableFields');

    this.set('sortOptions', [
      { key: 'omeda.ChangedDate', label: 'Updated' },
      { key: 'omeda.SignUpDate', label: 'Created' },
      { key: 'lastRetrievedAt', label: 'Last Retrieved' },
      { key: 'fieldCount', label: 'Quality' },
      { key: 'createdAt', label: 'Created' },
    ].concat(viewableFields.slice()));

    this.set('sortBy', 'omeda.ChangedDate');
    this.set('ascending', false);

    this.set('searchFields', [
      { key: 'entity', label: 'Omeda ID' },
    ].concat(viewableFields.slice()));
    this.set('searchBy', 'emailAddress');
  },
});
