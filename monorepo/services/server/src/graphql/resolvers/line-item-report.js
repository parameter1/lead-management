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
     * @param {void} _
     * @param {object} args
     * @param {LeadsGraphQLContext} contextValue
     */
    emailLineItemMetricsReport: async (_, { hash, sort }, { customClickFilterParams, tenant }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(lineitem, tenant, {
        customClickFilterParams,
      });

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
     * @param {void} _
     * @param {object} args
     * @param {LeadsGraphQLContext} contextValue
     */
    emailLineItemIdentitiesReport: async (_, { hash, pagination, sort }, {
      customClickFilterParams,
      tenant,
    }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const {
        identityEntities,
      } = await emailReportService.getClickEventIdentifiers(lineitem, tenant, {
        customClickFilterParams,
      });

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
     * @param {void} _
     * @param {object} args
     * @param {LeadsGraphQLContext} contextValue
     */
    emailLineItemIdentityExportReport: async (_, { hash, pagination, sort }, {
      customClickFilterParams,
      tenant,
    }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const pipeline = await emailReportService.buildExportPipeline(lineitem, tenant, {
        customClickFilterParams,
      });

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
     * @param {void} _
     * @param {object} args
     * @param {LeadsGraphQLContext} contextValue
     */
    emailLineItemActivityReport: async (_, { hash }, { customClickFilterParams, tenant }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(lineitem, tenant, {
        customClickFilterParams,
      });

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

/**
 * @typedef {import("../context").LeadsGraphQLContext} LeadsGraphQLContext
 */
