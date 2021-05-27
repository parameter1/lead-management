const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Order = require('../../models/order');
const LineItem = require('../../models/line-item');

module.exports = {
  /**
   *
   */
  OrderConnection: paginationResolvers.connection,

  /**
   *
   */
  Order: {
    customer: (order, _, { loaders }) => loaders.customer.load(order.customerId),
    salesRep: (order, _, { loaders }) => loaders.user.load(order.salesRepId),
    lineitems: (order) => LineItem.find({ orderId: order._id || null }),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    order: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Order.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No order found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allOrders: (_, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return new Pagination(Order, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchOrders: (_, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { deleted: false }, options);
      return instance.paginate(Order, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createOrder: (root, { input }, { auth }) => {
      auth.check();
      const {
        customerId,
        salesRepId,
        name,
        notes,
      } = input;

      const record = new Order({
        customerId,
        salesRepId,
        name,
        notes,
      });
      return record.save();
    },

    /**
     *
     */
    updateOrder: async (root, { input }, { auth }) => {
      auth.check();
      const {
        id,
        customerId,
        salesRepId,
        name,
        notes,
      } = input;

      const record = await Order.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No order record found for ID ${id}.`);
      record.set({
        customerId,
        salesRepId,
        name,
        notes,
      });
      return record.save();
    },
  },
};
