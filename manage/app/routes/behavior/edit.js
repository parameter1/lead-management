import Route from '@ember/routing/route';
import { RouteQueryManager } from 'ember-apollo-client';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';

import query from 'leads-manage/gql/queries/behavior/content-query/view';
import updateContentQuery from 'leads-manage/gql/mutations/behavior/content-query/update';
import deleteContentQuery from 'leads-manage/gql/mutations/behavior/content-query/delete';

export default Route.extend(RouteQueryManager, FormMixin, {
  ohBehaveToken: inject(),

  async model({ id }) {
    const propertyId = this.get('ohBehaveToken').getPropertyId();

    const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
    const context = { ohBehaveToken };

    const variables = { input: { propertyId, id } };
    return this.get('apollo').watchQuery({ query, variables, context, fetchPolicy: 'network-only' }, 'behaviorContentQuery');
  },

  actions: {
    async update(model) {
      this.startRouteAction();
      const propertyId = this.get('ohBehaveToken').getPropertyId();
      const mutation = updateContentQuery;
      const { id, name, criteria } = model;

      const formatted = criteria.reduce((agg, group) => {
        const { type, items } = group;
        const ids = items.map(item => item.id);
        agg.push({ type, ids });
        return agg;
      }, []);

      const payload = { name, criteria: formatted, propertyId };
      const input = { id, payload };
      const variables = { input };

      try {
        const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
        const context = { ohBehaveToken };
        await this.get('apollo').mutate({ mutation, variables, context }, 'behaviorUpdateContentQuery');
        this.get('notify').info('Query successfully updated.');
        await this.transitionTo('behavior.view', id);
      } catch (e) {
        this.get('graphErrors').show(e)
      } finally {
        this.endRouteAction()
      }
    },

    async delete(id, routeName) {
      this.startRouteAction();
      const mutation = deleteContentQuery;
      const variables = { input: { id } };
      try {
        const ohBehaveToken = await this.get('ohBehaveToken').retrieve();
        const context = { ohBehaveToken };
        await this.get('apollo').mutate({ mutation, variables, context }, 'behaviorDeleteContentQuery');
        this.transitionTo(routeName);
      } catch (e) {
        this.get('graphErrors').show(e)
      } finally {
        this.endRouteAction()
      }
    },
  },
});
