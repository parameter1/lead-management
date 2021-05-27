const Customer = require('../../models/customer');
const EmailCategory = require('../../models/email-category');
const EmailSendUrl = require('../../models/email-send-url');
const EventEmailClick = require('../../models/events/email-click');
const ExtractHost = require('../../models/extracted-host');
const ExtractUrl = require('../../models/extracted-url');

module.exports = {
  /**
   *
   */
  EmailClickEventReportRow: {
    /**
     *
     */
    id({ sendId, urlId }) {
      return `${sendId}_${urlId}`;
    },

    /**
     *
     */
    send({ sendId }, _, { loaders }) {
      return loaders.emailSend.load(sendId);
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
        customerIds,
      } = input;

      const sendUrlQuery = {
        isTestSend: false,
        sentDate: { $gte: start, $lte: end },
      };

      let urlIds;
      if (tagIds.length || customerIds.length) {
        // account for child customers
        const childCustomerIds = customerIds.length ? await Customer.distinct('_id', { parentId: { $in: customerIds } }) : [];
        const allCustomerIds = [...(customerIds.length ? customerIds : []), ...childCustomerIds];

        // load hosts for tags or customers (when applicable)
        const hostPromises = [];
        hostPromises.push(tagIds.length ? ExtractHost.distinct('_id', { tagIds: { $in: tagIds } }) : Promise.resolve([]));
        hostPromises.push(allCustomerIds.length ? ExtractHost.distinct('_id', { customerId: { $in: allCustomerIds } }) : Promise.resolve([]));

        const [tagHostIds, customerHostIds] = await Promise.all(hostPromises);

        // look for urls that have the requested tags or hosts with tags
        const tagOr = [];
        if (tagIds.length) tagOr.push({ tagIds: { $in: tagIds } });
        if (tagHostIds.length) tagOr.push({ resolvedHostId: { $in: tagHostIds } });

        // look for urls that have the requested customers or hosts with customers
        const customerOr = [];
        if (allCustomerIds.length) customerOr.push({ customerId: { $in: allCustomerIds } });
        if (customerHostIds.length) customerOr.push({ resolvedHostId: { $in: customerHostIds } });

        // require that the urls have the requested tags and the customers
        const $and = [];
        if (tagOr.length) $and.push({ $or: tagOr });
        if (customerOr.length) $and.push({ $or: customerOr });

        // find all url IDs that match the criteria
        urlIds = await ExtractUrl.distinct('_id', { $and });
        sendUrlQuery.urlId = { $in: urlIds };
      }
      if (!includeNewsletters) {
        // do not allow sends that are categorized as newsletters
        const newsletterCategoryIds = await EmailCategory.distinct('_id', { isNewsletter: true });
        sendUrlQuery.categoryId = { $nin: newsletterCategoryIds };
      }

      // find all sends that match the criteria
      const sendIds = await EmailSendUrl.distinct('sendId', sendUrlQuery);

      // aggregate and group the event data based on the eligible sends and urls
      return EventEmailClick.aggregate([
        {
          $match: {
            job: { $in: sendIds },
            ...(urlIds && { url: { $in: urlIds } }),
            $or: [
              { 'guids.0': { $exists: true } },
              { n: { $gt: 0 } },
            ],
          },
        },
        { $addFields: { guidn: { $size: '$guids' } } },
        {
          $group: {
            _id: { sendId: '$job', urlId: '$url' },
            identityIds: { $addToSet: '$usr' },
            clicks: { $sum: { $add: ['$n', '$guidn'] } },
          },
        },
        { $addFields: { uniqueClicks: { $size: '$identityIds' } } },
        {
          $project: {
            sendId: '$_id.sendId',
            urlId: '$_id.urlId',
            identityIds: 1,
            clicks: 1,
            uniqueClicks: 1,
          },
        },
      ]);
    },
  },
};
