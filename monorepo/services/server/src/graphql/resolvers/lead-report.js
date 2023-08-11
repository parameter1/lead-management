const { Pagination, paginationResolvers } = require('../pagination');
const {
  Campaign,
  Identity,
  OmedaEmailClick,
} = require('../../mongodb/models');
const emailReportService = require('../../services/email-report');
const adReportService = require('../../services/ad-report');
// const FormRepo = require('../../repos/form');

module.exports = {
  ReportEmailActivityConnection: {
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

  ReportEmailIdentityExportConnection: {
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

  ReportEmailIdentityExportNode: {
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
    reportEmailMetrics: async (root, {
      hash,
      sort,
      starting,
      ending,
    }, { tenant }) => {
      const campaign = await Campaign.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(campaign, tenant, {
        // allows all idenities to be considered, not just the max of 200.
        enforceMaxIdentities: false,
        starting,
        ending,
      });

      const $match = {
        idt: { $in: identityEntities },
        url: { $in: urlIds },
        dep: { $in: deploymentEntities },
        date: { $gte: campaign.startDate },
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
      const metricsObj = await emailReportService.buildEmailMetrics({
        results,
        sort,
        deploymentEntities,
      });
      const outputObj = { ...metricsObj, campaign };
      return outputObj;
    },

    /**
     *
     */
    reportEmailActivity: async (root, { hash }, { tenant }) => {
      const campaign = await Campaign.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(campaign, tenant);

      const $match = {
        idt: { $in: identityEntities },
        url: { $in: urlIds },
        dep: { $in: deploymentEntities },
        date: { $gte: campaign.startDate },
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
        emailReportService.identityFieldProjection(campaign),
      ]);
      result.projection = projection;
      return result;
    },

    /**
     *
     */
    reportEmailIdentityExport: async (root, { hash, pagination, sort }, { tenant }) => {
      const campaign = await Campaign.findByHash(hash);

      const pipeline = await emailReportService.buildExportPipeline(campaign, tenant);

      // @todo This isn't as effecient as it could be.
      // The match phase could be limited by the incoming after cursor, as well as the first value.
      const results = await OmedaEmailClick.aggregate(pipeline);
      const identityEntities = results.map((r) => r._id);

      const criteria = { entity: { $in: identityEntities } };
      const projection = await emailReportService.identityFieldProjection(campaign);
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
    reportEmailIdentities: async (root, { hash, pagination, sort }, { tenant }) => {
      const campaign = await Campaign.findByHash(hash);

      const {
        identityEntities,
      } = await emailReportService.getClickEventIdentifiers(campaign, tenant);

      const criteria = { entity: { $in: identityEntities } };
      const projection = await emailReportService.identityFieldProjection(campaign);
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
    reportAdIdentities: async (root, { hash, pagination, sort }) => {
      const campaign = await Campaign.findByHash(hash);

      const identityIds = await adReportService.getEligibleIdentityIds(campaign);

      const criteria = { _id: { $in: identityIds } };
      const projection = await adReportService.identityFieldProjection(campaign);
      return new Pagination(Identity, {
        pagination,
        sort,
        criteria,
        projection,
      });
    },

    /**
     * @todo restore
     */
    // reportForms: async (root, { hash }) => {
    //   const campaign = await Campaign.findByHash(hash);
    //   const { excludeFormIds } = campaign.forms;

    //   const forms = await FormRepo.getEligibleCampaignForms(campaign);
    //   const exclude = Array.isArray(excludeFormIds)
    //     ? excludeFormIds.map((formId) => `${formId}`) : [];
    //   return forms.filter((form) => !exclude.includes(`${form.id}`));
    // },
  },
};
