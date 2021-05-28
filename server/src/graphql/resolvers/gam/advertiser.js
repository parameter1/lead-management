const gamLoadOne = require('../../utils/gam-load-one');
const gamLoadMany = require('../../utils/gam-load-many');
const Customer = require('../../../mongodb/models/customer');

module.exports = {
  /**
   *
   */
  GAMCompany: {
    /**
     *
     */
    customer: async (company) => Customer.findOne({ gamAdvertiserIds: company.id }),
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    unlinkGAMAdvertiser: async (_, { input }, context, info) => {
      const { auth } = context;
      auth.checkAdmin();
      const { advertiserId } = input;
      const customers = await Customer.find({ gamAdvertiserIds: advertiserId });
      await Promise.all(customers.map((customer) => {
        customer.set('gamAdvertiserIds', customer.gamAdvertiserIds.filter((id) => id !== advertiserId));
        return customer.save();
      }));
      return gamLoadOne({
        type: 'company',
        id: advertiserId,
        context,
        info,
      });
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    listGAMAdvertisers: (_, { input }, context, info) => {
      const { auth } = context;
      auth.check();

      return gamLoadMany({
        ...input,
        type: 'company',
        criteria: "type = 'ADVERTISER'",
        context,
        info,
      });
    },
  },
};
