const { getAsObject } = require('@parameter1/utils');
const Customer = require('../../../mongodb/models/customer');
const loadVideos = require('../../utils/brightcove-load-videos');

module.exports = {
  /**
   *
   */
  BrightcoveCMSVideoSearchFieldEnum: {
    NAME: 'name',
  },

  /**
   *
   */
  BrightcoveCMSVideoSortFieldEnum: {
    CREATED_AT: 'created_at',
    NAME: 'name',
    PUBLISHED_AT: 'published_at',
    UPDATED_AT: 'updated_at',
  },

  /**
   *
   */
  BrightcoveCMSVideo: {
    /**
     *
     */
    customers: (video) => Customer.find({ brightcoveVideoIds: video.id, deleted: false }),

    /**
     *
     */
    images: (video, { input }) => {
      const images = getAsObject(video, 'images');
      return Object.keys(images).map((type) => {
        const image = images[type];
        return {
          ...image,
          type,
        };
      }).filter((image) => {
        if (!input.type) return true;
        return image.type === input.type;
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
    brightcoveCMSVideo: async (_, { input }, { brightcove, auth }) => {
      auth.check();
      const { id } = input;
      return brightcove.cms.getVideoById({ id });
    },

    /**
     *
     */
    brightcoveCMSVideos: async (_, { input }, { brightcove, auth }) => {
      auth.check();
      return loadVideos(input, { brightcove });
    },
  },
};
