const { Pagination, paginationResolvers } = require('../pagination');
const {
  Campaign,
  Identity,
  OmedaEmailClick,
  OmedaEmailDeployment,
} = require('../../mongodb/models');
const emailReportService = require('../../services/email-report');
// const adReportService = require('../../services/ad-report');
// const FormRepo = require('../../repos/form');

module.exports = {
  ReportEmailActivityConnection: {
    totalCount: (results) => results.length,
    edges: (results, _, { loaders }) => results.map((result) => ({
      node: () => ({
        identity: () => loaders.identity.load(result._id.identityId),
        send: () => loaders.emailSend.load(result._id.sendId),
        url: () => loaders.extractedUrl.load(result._id.urlId),
        last: () => result.last,
        clicks: () => result.clicks,
      }),
      cursor: () => result._id.identityId,
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
        const row = paginated.meta.find((r) => `${r._id}` === `${node.id}`);
        const { urlIds, sendIds } = row;
        return {
          node: {
            identity: node,
            urlIds,
            sendIds,
          },
          cursor,
        };
      });
    },
  },

  ReportEmailIdentityExportNode: {
    urls: (node, _, { loaders }) => loaders.extractedUrl.loadMany(node.urlIds),
    sends: (node, _, { loaders }) => loaders.emailSend.loadMany(node.sendIds),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    reportEmailMetrics: async (root, { hash, sort }) => {
      const campaign = await Campaign.findByHash(hash);

      const {
        identityEntities,
        urlIds,
        deploymentEntities,
      } = await emailReportService.getClickEventIdentifiers(campaign, {
        // allows all idenities to be considered, not just the max of 200.
        enforceMaxIdentities: false,
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
          clicks: { $sum: '$n' },
        },
      });
      const results = await OmedaEmailClick.aggregate(pipeline);
      return emailReportService.buildEmailMetrics({ results, sort, deploymentEntities });
    },

    /**
     *
     */
    reportEmailActivity: async (root, { hash }) => {
      const campaign = await Campaign.findByHash(hash);

      const {
        identityIds,
        urlIds,
        sendIds,
      } = await emailReportService.getClickEventIdentifiers(campaign);

      const $match = {
        usr: { $in: identityIds },
        url: { $in: urlIds },
        job: { $in: sendIds },
        $or: [
          { 'guids.0': { $exists: true } },
          { n: { $gt: 0 } },
        ],
      };
      // @todo This is being shut off to allow events just after the sent date to
      // display. Will still limit by the campaign start date.
      // const dateCriteria = emailReportService.createDateCriteria(campaign);
      // if (dateCriteria) $match.day = dateCriteria;
      if (campaign.startDate) $match.day = { $gte: campaign.startDate };

      const pipeline = [];
      pipeline.push({ $match });
      pipeline.push({ $addFields: { guidn: { $size: '$guids' } } });
      pipeline.push({
        $group: {
          _id: {
            identityId: '$usr',
            sendId: '$job',
            urlId: '$url',
          },
          clicks: { $sum: { $add: ['$n', '$guidn'] } },
          last: { $max: '$last' },
        },
      });
      pipeline.push({ $sort: { last: -1 } });
      const [result, projection] = await Promise.all([
        EventEmailClick.aggregate(pipeline),
        emailReportService.identityFieldProjection(campaign),
      ]);
      result.projection = projection;
      return result;
    },

    /**
     *
     */
    reportEmailIdentityExport: async (root, { hash, pagination, sort }) => {
      const campaign = await Campaign.findByHash(hash);

      const pipeline = await emailReportService.buildExportPipeline(campaign);

      // @todo This isn't as effecient as it could be.
      // The match phase could be limited by the incoming after cursor, as well as the first value.
      const results = await EventEmailClick.aggregate(pipeline);
      const identityIds = results.map((r) => r._id);

      const criteria = { _id: { $in: identityIds } };
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
    reportEmailIdentities: async (root, { hash, pagination, sort }) => {
      const campaign = await Campaign.findByHash(hash);

      const { identityIds } = await emailReportService.getClickEventIdentifiers(campaign);

      const criteria = { _id: { $in: identityIds } };
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
