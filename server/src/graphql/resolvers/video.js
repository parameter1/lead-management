const { Pagination, TypeAhead, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const Customer = require('../../models/customer');
const Video = require('../../models/video');

module.exports = {
  /**
   *
   */
  VideoConnection: paginationResolvers.connection,

  /**
   *
   */
  Video: {
    /**
     *
     */
    customer: (video) => {
      if (!video.customerId) return null;
      return Customer.findOne({ _id: video.customerId || null, deleted: false });
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    video: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Video.findById(id);
      if (!record) throw new Error(`No video record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allVideos: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(Video, { pagination, sort });
    },

    /**
     *
     */
    searchVideos: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
      return instance.paginate(Video, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    videoCustomer: async (root, { input }, { auth }) => {
      auth.checkAdmin();
      const { videoId, customerId } = input;
      const video = await Video.findById(videoId);
      if (!video) throw new Error(`No video found for ID '${videoId}'`);
      video.customerId = customerId || undefined;
      return video.save();
    },
  },
};
