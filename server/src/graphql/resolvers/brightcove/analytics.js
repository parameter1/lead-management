const getReport = require('../../utils/brightcove-get-report');

module.exports = {
  /**
   *
   */
  BrightcoveAnalyticsReportSortFieldEnum: {
    VIDEO_VIEW: 'video_view',
  },

  /**
   *x
   */
  BrightcoveAnalyticsReportWhereKeyEnum: {
    VIDEO: 'video',
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    brightcoveAnalyticsReport: async (_, { input }, { brightcove, auth }) => {
      auth.check();
      return getReport(input, { brightcove });
    },
  },
};
