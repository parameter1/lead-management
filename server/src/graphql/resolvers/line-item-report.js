const { Pagination, paginationResolvers } = require('@limit0/mongoose-graphql-pagination');
const EmailLineItem = require('../../models/line-item/email');
const EventEmailClick = require('../../models/events/email-click');
const EmailSend = require('../../models/email-send');
const ExtractedUrl = require('../../models/extracted-url');
const Identity = require('../../models/identity');
const emailReportService = require('../../services/line-item/email-report');

module.exports = {
  EmailLineItemActivityReportConnection: {
    totalCount: (results) => results.length,
    edges: (results) => results.map((result) => ({
      node: () => ({
        identity: () => Identity.findById(result._id.identityId, results.projection),
        send: () => EmailSend.findById(result._id.sendId),
        url: () => ExtractedUrl.findById(result._id.urlId),
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

  EmailLineItemIdentityExportReportConnection: {
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

  EmailLineItemIdentityExportReportNode: {
    urls: (node) => ExtractedUrl.find({ _id: { $in: node.urlIds } }),
    sends: (node) => EmailSend.find({ _id: { $in: node.sendIds } }),
  },

  EmailLineItemMetricsReport: {
    sends: (results) => results,
    totals: (results) => results,
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
        identityIds,
        urlIds,
        sendIds,
      } = await emailReportService.getClickEventIdentifiers(lineitem);

      const $match = {
        usr: { $in: identityIds },
        url: { $in: urlIds },
        job: { $in: sendIds },
        day: emailReportService.createEventDateCriteria(lineitem),
        $or: [
          { 'guids.0': { $exists: true } },
          { n: { $gt: 0 } },
        ],
      };

      const pipeline = [];
      pipeline.push({ $match });
      pipeline.push({ $addFields: { guidn: { $size: '$guids' } } });
      pipeline.push({
        $group: {
          _id: '$job',
          identityIds: { $addToSet: '$usr' },
          clicks: { $sum: { $add: ['$n', '$guidn'] } },
        },
      });
      const results = await EventEmailClick.aggregate(pipeline);
      return emailReportService.buildEmailMetrics({ results, sort, sendIds });
    },

    /**
     *
     */
    emailLineItemIdentitiesReport: async (root, { hash, pagination, sort }) => {
      const lineitem = await EmailLineItem.findByHash(hash);

      const { identityIds } = await emailReportService.getClickEventIdentifiers(lineitem);

      const criteria = { _id: { $in: identityIds } };
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
      const results = await EventEmailClick.aggregate(pipeline);
      const identityIds = results.map((r) => r._id);

      const criteria = { _id: { $in: identityIds } };
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
        identityIds,
        urlIds,
        sendIds,
      } = await emailReportService.getClickEventIdentifiers(lineitem);

      const $match = {
        usr: { $in: identityIds },
        url: { $in: urlIds },
        job: { $in: sendIds },
        day: emailReportService.createEventDateCriteria(lineitem),
        $or: [
          { 'guids.0': { $exists: true } },
          { n: { $gt: 0 } },
        ],
      };

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
        emailReportService.identityFieldProjection(lineitem),
      ]);
      result.projection = projection;
      return result;
    },
  },
};
