const { Pagination, paginationResolvers, TypeAhead } = require('../pagination');
const AdCreativeTracker = require('../../mongodb/models/ad-creative-tracker');

module.exports = {
  /**
   *
   */
  AdCreativeTrackerConnection: paginationResolvers.connection,

  AdCreativeTracker: {
    customer: ({ customerId }, _, { loaders }) => loaders.customer.load(customerId),
    tags: ({ tagIds }, _, { loaders }) => loaders.tag.loadMany(tagIds),
    trackers: ({ id }, _, { host }) => {
      const baseUrl = `https://${host}/creative`;
      return {
        click: `${baseUrl}/c/${id}?lid=%eaid!&cid=%ecid!&idt=%%PATTERN:leads_idt%%`,
        impression: `${baseUrl}/i/${id}?lid=%eaid!&cid=%ecid!&idt=%%PATTERN:leads_idt%%`,
      };
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    adCreativeTracker: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await AdCreativeTracker.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No creative tracker found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allAdCreativeTrackers: (root, { pagination, sort }, { auth }) => {
      auth.check();
      const criteria = { deleted: false };
      return new Pagination(AdCreativeTracker, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchAdCreativeTrackers: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { deleted: false }, options);
      return instance.paginate(AdCreativeTracker, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    createAdCreativeTracker: (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { payload } = input;
      const {
        description,
        url,
        customerId,
        tagIds,
      } = payload;
      return AdCreativeTracker.create({
        description,
        url,
        customerId,
        tagIds,
      });
    },

    /**
     *
     */
    updateAdCreativeTracker: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id, payload } = input;
      const {
        description,
        url,
        customerId,
        tagIds,
      } = payload;
      const record = await AdCreativeTracker.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No tag record found for ID ${id}.`);
      record.set({
        description,
        url,
        customerId,
        tagIds,
      });
      return record.save();
    },

    /**
     *
     */
    deleteAdCreativeTracker: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { id } = input;
      const record = await AdCreativeTracker.findById(id);
      if (!record) throw new Error(`No tag record found for ID ${id}.`);
      record.deleted = true;
      await record.save();
      return 'ok';
    },
  },
};
