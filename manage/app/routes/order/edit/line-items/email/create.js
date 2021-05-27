import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';

export default Route.extend(FormMixin, RouteQueryManager, {
  model() {
    return {
      categories: [],
      tags: [],
      range: {},
      linkTypes: ['(Not Set)', 'Advertising'],
      requiredFields: [
       'emailAddress',
      ],
      excludedFields: [
        'phoneNumber',
      ],
      identityFilters: [],
      archived: false,
    }
  },

  setupController(controller, model) {
    this._super(controller, model);
    controller.set('order', this.modelFor('order.edit'));
  },
});
