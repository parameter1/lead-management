import Route from '@ember/routing/route';
import ListRouteMixin from 'leads-manage/mixins/list-route-mixin';

import query from 'leads-manage/gql/queries/order/line-item/list';
import search from 'leads-manage/gql/queries/order/line-item/search';

export default Route.extend(ListRouteMixin, {
  /**
   *
   * @param {object} params
   */
  model({ first, sortBy, ascending, phrase, searchType, searchBy }) {
    const order = this.modelFor('order.edit');
    const input = { orderId: order.id };
    return this.getResults({
      query,
      queryKey: 'allLineItemsForOrder',
      queryVars: { input },
    }, {
      search,
      searchKey: 'searchLineItemsForOrder',
      searchVars: { input },
    }, { first, sortBy, ascending, phrase, searchType, searchBy });
  },
});
