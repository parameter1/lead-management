import ListController from '../../abstract-list';

export default ListController.extend({
  init() {
    this._super(...arguments);
    this.set('sortOptions', [
      { key: 'omeda.CreatedDate', label: 'Created Date' },
      { key: 'omeda.DeploymentName', label: 'Name' },
      { key: 'omeda.SentDate', label: 'Sent Date' },
    ]);
    this.set('sortBy', 'omeda.SentDate');

    this.set('searchFields', [
      { key: 'omeda.DeploymentName', label: 'Name' },
      { key: 'omeda.Splits.0.Subject', label: 'Subject' },
    ]);
    this.set('searchBy', 'omeda.DeploymentName');
  },
});
