import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import FormMixin from 'leads-manage/mixins/form-mixin';

import archivedMutation from 'leads-manage/gql/mutations/line-item/archived';

export default Route.extend(AuthenticatedRouteMixin, FormMixin, RouteQueryManager, {
  beforeModel(transition) {
    if (!this.user.get('isAtLeastMember')) {
     transition.abort();
     this.transitionTo('index');
    }
  },

  actions: {
    async toggleLineItemArchive(id, archived) {
      this.startRouteAction();
      try {
        const input = { id, archived: !archived };
        const variables = { input };
        await this.get('apollo').mutate({ mutation: archivedMutation, variables }, 'lineItemArchived');
        this.get('notify').info('Archived flag saved.');
        await this.refresh();
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endRouteAction();
      }
    },
  },
});
