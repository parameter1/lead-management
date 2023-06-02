const { Pagination, paginationResolvers } = require('../pagination');
const {
  EmailLineItem,
  Identity,
  OmedaEmailClick,
} = require('../../mongodb/models');
const emailReportService = require('../../services/line-item/email-report');

module.exports = {
  EmailLineItemActivityReportConnection: {
    totalCount: (results) => results.length,
    edges: (results, _, { loaders }) => results.map((result) => ({
      node: () => ({
        identity: () => loaders.identityEntity.load(result._id.identityEntity),
        deployment: () => loaders.emailDeploymentEntity.load(result._id.deploymentEntity),
        url: () => loaders.extractedUrl.load(result._id.urlId),
        last: () => result.last,
        clicks: () => result.clicks,
      }),
      cursor: () => result._id.identityEntity,
    })),
    pageInfo: () => ({
      hasNextPage: () => false,
      endCursor: () => null,
    }),
  },

  EmailLineItemIdentityExportReportConnection: {
    ...paginationResolvers.connection,
    edges: async (paginated) => {
      const edges = await paginated.getEdges();
      return edges.map((edge) => {
        const { node, cursor } = edge;
        const row = paginated.meta.find((r) => r._id === node.entity);
        const { urlIds, deploymentEntities } = row;
        return {
          node: {
            clicks: row.clicks || 0,
            identity: node,
            urlIds,
            deploymentEntities,
          },
          cursor,
        };
      });
    },
  },

  EmailLineItemIdentityExportReportNode: {
    urls: (node, _, { loaders }) => loaders.extractedUrl.loadMany(node.urlIds),
    deployments: (node, _, { loaders }) => loaders
      .emailDeploymentEntity.loadMany(node.deploymentEntities),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    emailLineItemMetricsReport: async (root, { hash, sort }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(lineitem);

      const $match = {
        idt: { $in: identityEntities },
        url: { $in: urlIds },
        dep: { $in: deploymentEntities },
        date: { $gte: lineitem.range.start, $lte: emailReportService.getEndDate(lineitem) },
      };

      const pipeline = [];
      pipeline.push({ $match });
      pipeline.push({
        $group: {
          _id: '$dep',
          identityEntities: { $addToSet: '$idt' },
          clicks: { $sum: { $cond: [{ $gt: ['$n', 0] }, '$n', 1] } },
        },
      });
      const results = await OmedaEmailClick.aggregate(pipeline);
      return emailReportService.buildEmailMetrics({ results, sort, deploymentEntities });
    },

    /**
     *
     */
    emailLineItemIdentitiesReport: async (root, { hash, pagination, sort }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const { identityEntities } = await emailReportService.getClickEventIdentifiers(lineitem);

      const criteria = { entity: { $in: identityEntities } };
      const projection = await emailReportService.identityFieldProjection(lineitem);
      return new Pagination(Identity, {
        pagination,
        sort,
        criteria,
        projection,
      });
    },

    /**
     *
     */
    emailLineItemIdentityExportReport: async (root, { hash, pagination, sort }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const pipeline = await emailReportService.buildExportPipeline(lineitem);

      // @todo This isn't as effecient as it could be.
      // The match phase could be limited by the incoming after cursor, as well as the first value.
      const results = await OmedaEmailClick.aggregate(pipeline);
      const identityEntities = results.map((r) => r._id);

      const criteria = { entity: { $in: identityEntities } };
      const projection = await emailReportService.identityFieldProjection(lineitem);
      const paginated = new Pagination(Identity, {
        pagination,
        sort,
        criteria,
        projection,
      });
      paginated.meta = results;
      return paginated;
    },

    /**
     *
     */
    emailLineItemActivityReport: async (root, { hash }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(lineitem);

      const $match = {
        idt: { $in: identityEntities },
        url: { $in: urlIds },
        dep: { $in: deploymentEntities },
        date: { $gte: lineitem.range.start, $lte: emailReportService.getEndDate(lineitem) },
      };

      const pipeline = [];
      pipeline.push({ $match });
      pipeline.push({
        $group: {
          _id: {
            identityEntity: '$idt',
            deploymentEntity: '$dep',
            urlId: '$url',
          },
          clicks: { $sum: { $cond: [{ $gt: ['$n', 0] }, '$n', 1] } },
          last: { $max: '$date' },
        },
      });
      pipeline.push({ $sort: { last: -1 } });
      const [result, projection] = await Promise.all([
        OmedaEmailClick.aggregate(pipeline),
        emailReportService.identityFieldProjection(lineitem),
      ]);
      result.projection = projection;
      return result;
    },
  },
};
