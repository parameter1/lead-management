const { Pagination, paginationResolvers } = require('../pagination');
const ExcludedEmailDomain = require('../../mongodb/models/excluded-email-domain');

module.exports = {
  /**
   *
   */
  ExcludedEmailDomainConnection: paginationResolvers.connection,

  /**
   *
   */
  Query: {
    /**
     *
     */
    excludedEmailDomain: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await ExcludedEmailDomain.findById(id);
      if (!record) throw new Error(`No excluded domain record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allExcludedEmailDomains: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(ExcludedEmailDomain, { pagination, sort });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createExcludedEmailDomain: (root, { input }, { auth }) => {
      auth.check();
      const { domain } = input;
      const record = new ExcludedEmailDomain({ domain });
      return record.save();
    },

    /**
     *
     */
    deleteExcludedEmailDomain: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await ExcludedEmailDomain.findById(id);
      if (!record) throw new Error(`No excluded domain record found for ID ${id}.`);
      await record.remove();
      return 'ok';
    },
  },
};
