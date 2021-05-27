const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const gamLoadMany = require('../utils/gam-load-many');
const emptyConnection = require('../../gam-graphql/empty-connection');
const Customer = require('../../models/customer');
const customerVideos = require('../utils/brightcove-customer-videos');

const { isArray } = Array;

const checkForExistingAdvertiserLink = async ({ customerId, advertiserIds }) => {
  if (!advertiserIds.length) return null;
  const query = {
    deleted: false,
    gamAdvertiserIds: { $in: advertiserIds },
    ...(customerId && { _id: { $ne: customerId } }),
  };
  const customer = await Customer.findOne(query, ['_id']);
  if (customer) throw new Error('Another customer is already linked to one of these advertisers.');
  return false;
};

module.exports = {
  /**
   *
   */
  Customer: {
    /**
     *
     */
    children: (customer) => Customer.find({ parentId: customer.id }),

    /**
     *
     */
    linkedAdvertisers: (campaign) => campaign,

    /**
     *
     */
    linkedVideos: (campaign) => campaign,

    /**
     *
     */
    parent: ({ parentId }, _, { loaders }) => {
      if (!parentId) return null;
      return loaders.customer.load(parentId);
    },
  },

  /**
   *
   */
  CustomerLinkedAdvertisers: {
    /**
     *
     */
    googleAdManager: async ({ gamAdvertiserIds }, _, context, info) => {
      if (!isArray(gamAdvertiserIds) || !gamAdvertiserIds.length) return emptyConnection();
      return gamLoadMany({
        type: 'company',
        criteria: `type = 'ADVERTISER' AND id IN (${gamAdvertiserIds.join(',')})`,
        context,
        info,
      });
    },
  },

  /**
   *
   */
  CustomerLinkedVideos: {
    /**
     *
     */
    brightcove: async (customer, { input }, { brightcove, loaders }) => customerVideos(
      customer.id,
      input,
      { brightcove, loaders },
    ),
  },

  /**
   *
   */
  CustomerConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    customer: async (root, { input }, { auth, loaders }) => {
      auth.check();
      const { id } = input;
      const customer = await loaders.customer.load(id);
      if (!customer || customer.deleted) throw new Error(`No customer record found for ID ${id}.`);
      return customer;
    },

    /**
     *
     */
    customerBrightcoveVideos: async (_, { input }, { brightcove, loaders, auth }) => {
      auth.check();
      const { customerId, ...rest } = input;
      return customerVideos(customerId, rest, { brightcove, loaders });
    },

    /**
     *
     */
    allCustomers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return new Pagination(Customer, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchCustomers: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { deleted: false }, options);
      return instance.paginate(Customer, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { payload } = input;
      const {
        name,
        description,
        website,
        parentId,
        gamAdvertiserIds,
      } = payload;
      await checkForExistingAdvertiserLink({ advertiserIds: gamAdvertiserIds });
      const record = new Customer({
        name,
        description,
        website,
        parentId,
        gamAdvertiserIds,
      });
      return record.save();
    },

    /**
     *
     */
    updateCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id, payload } = input;
      const {
        name,
        description,
        website,
        parentId,
        gamAdvertiserIds,
      } = payload;
      const [record] = await Promise.all([
        Customer.findOne({ _id: id || null, deleted: false }),
        checkForExistingAdvertiserLink({ customerId: id, advertiserIds: gamAdvertiserIds }),
      ]);

      if (!record) throw new Error(`No customer record found for ID ${id}.`);
      record.set({
        name,
        description,
        website,
        parentId,
        gamAdvertiserIds,
      });
      return record.save();
    },

    /**
     *
     */
    deleteCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const record = await Customer.findById(id);
      if (!record) throw new Error(`No customer record found for ID ${id}.`);
      record.deleted = true;
      await record.save();
      return 'ok';
    },

    /**
     *
     */
    linkGAMAdvertiserToCustomer: async (_, { input }, { auth }) => {
      auth.checkAdmin();
      const { customerId, advertiserId } = input;
      const [customer] = await Promise.all([
        Customer.findOne({ _id: customerId || null, deleted: false }),
        checkForExistingAdvertiserLink({ customerId, advertiserIds: [advertiserId] }),
      ]);
      if (!customer) throw new Error(`No customer record found for ID ${customerId}.`);
      const gamAdvertiserIds = new Set([...customer.gamAdvertiserIds, advertiserId]);
      customer.set('gamAdvertiserIds', [...gamAdvertiserIds]);
      return customer.save();
    },

    /**
     *
     */
    linkBrightcoveVideoToCustomers: async (_, { input }, { auth }) => {
      auth.checkAdmin();
      const { customerIds, videoId } = input;
      if (!customerIds.length) {
        const customers = await Customer.find({ brightcoveVideoIds: videoId });
        await Promise.all(customers.map((customer) => {
          customer.set('brightcoveVideoIds', customer.brightcoveVideoIds.filter((id) => id !== videoId));
          return customer.save();
        }));
        return true;
      }
      const customers = await Customer.find({ _id: { $in: customerIds } || null, deleted: false });
      await Promise.all(customers.map((customer) => {
        const brightcoveVideoIds = new Set([...customer.brightcoveVideoIds, videoId]);
        customer.set('brightcoveVideoIds', [...brightcoveVideoIds]);
        return customer.save();
      }));
      return true;
    },
  },
};
