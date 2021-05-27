import Service from '@ember/service';

export default Service.extend({
  init() {
    this._super(...arguments);
    this.set('types', ['(Not Set)', 'Advertising', 'Editorial']);
    this.set('adActions', { label: 'Clicks', value: 'click' });
  }
});
