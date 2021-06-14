const {
  Customer,
  OmedaEmailClick,
  OmedaEmailDeploymentUrl,
} = require('../../mongodb/models');

module.exports = {
  /**
   *
   */
  EmailClickEventReportRow: {
    /**
     *
     */
    id({ deploymentEntity, urlId }) {
      return `${deploymentEntity}_${urlId}`;
    },

    /**
     *
     */
    deployment({ deploymentEntity }, _, { loaders }) {
      return loaders.emailDeploymentEntity.load(deploymentEntity);
    },

    /**
     *
     */
    url({ urlId }, _, { loaders }) {
      return loaders.extractedUrl.load(urlId);
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    async emailClickEventReport(_, { input }) {
      const {
        start,
        end,
        includeNewsletters,
        tagIds,
      } = input;
      let { customerIds } = input;

      if (customerIds.length) {
        // account for child customers
        const childCustomerIds = await Customer.distinct('_id', { parentId: { $in: customerIds } });
        customerIds = [...childCustomerIds, ...customerIds];
      }

      const deploymentUrlQuery = {
        'deployment.sentDate': { $gte: start, $lte: end },
        'deployment.designation': includeNewsletters ? 'Newsletter' : { $ne: 'Newsletter' },
      };

      // look for urls that have the requested tags or hosts with tags
      const tagOr = [];
      if (tagIds.length) {
        tagOr.push({ 'host.tagIds': { $in: tagIds } });
        tagOr.push({ tagIds: { $in: tagIds } });
      }

      // look for urls that have the requested customers or hosts with customers
      const customerOr = [];
      if (customerIds.length) {
        customerOr.push({ 'host.customerId': { $in: customerIds } });
        customerOr.push({ customerId: { $in: customerIds } });
      }

      // require that the urls have the requested tags and the customers
      const $and = [];
      if (tagOr.length) $and.push({ $or: tagOr });
      if (customerOr.length) $and.push({ $or: customerOr });
      if ($and.length) deploymentUrlQuery.$and = $and;

      // find all match URLs
      const urlIds = await OmedaEmailDeploymentUrl.distinct('url._id', deploymentUrlQuery);
      if (!urlIds.length) return [];

      // aggregate and group the event data based on the eligible sends and urls
      return OmedaEmailClick.aggregate([
        { $match: { url: { $in: urlIds } } },
        {
          $group: {
            _id: { deploymentEntity: '$dep', urlId: '$url' },
            identityEntities: { $addToSet: '$idt' },
            clicks: { $sum: '$n' },
          },
        },
        { $addFields: { uniqueClicks: { $size: '$identityEntities' } } },
        {
          $project: {
            deploymentEntity: '$_id.deploymentEntity',
            urlId: '$_id.urlId',
            identityEntities: 1,
            clicks: 1,
            uniqueClicks: 1,
          },
        },
      ]);
    },
  },
};
