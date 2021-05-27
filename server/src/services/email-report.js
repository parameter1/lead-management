const escapeRegex = require('escape-string-regexp');
const ExtractedHost = require('../models/extracted-host');
const ExtractedUrl = require('../models/extracted-url');
const EmailSendUrl = require('../models/email-send-url');
const EmailSend = require('../models/email-send');
const ExcludedEmailDomain = require('../models/excluded-email-domain');
const Customer = require('../models/customer');
const EventEmailClick = require('../models/events/email-click');
const Identity = require('../models/identity');
const createDateCriteria = require('../utils/create-date-criteria');

const { isArray } = Array;

/**
 * Date range options....
 * 1. Allow all events for _EmailSends_ between campaign start/end,
 *    regardless if the event happened after the campaign end.
 *    For example: 6/16 - 6/23 had five sends, but the user clicked on
 *    a link in 23rd's send on the 24th... include the click even though
 *    it was outside the initial campaign date range.
 * 2. Also restrict events by campaign start/end dates. This was how
 *    the dates were initial thought-of in the node version of leads.
 *    But was discovered that option 1 was how PHP was handling it.
 * 3. Find all events between campaign start/end, but do not restrict
 *    by the send start/end date. This has not been implemented yet.
 */
module.exports = {
  /**
   * An eligible click event is one where:
   * 1. Inactive and filtered identities are NOT included.
   * 2.
   * @param {Campaign} campaign
   * @param {object} options
   * @param {boolean} [options.suppressInactives=true]
   */
  async getClickEventIdentifiers(campaign, {
    suppressInactives = true,
    enforceMaxIdentities = true,
  } = {}) {
    const {
      urlIds,
      sendIds,
    } = await this.getEligibleUrlAndSendIds(campaign);

    const identityIds = await this.getEligibleIdentityIds(campaign, {
      suppressInactives,
      enforceMaxIdentities,
      urlIds,
      sendIds,
    });

    return {
      identityIds,
      urlIds,
      sendIds,
    };
  },

  async identityFieldProjection(campaign) {
    const { email } = campaign;
    const excludeFields = await email.getExcludeFields();
    return excludeFields.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  },

  async buildExportPipeline(campaign) {
    const {
      identityIds,
      urlIds,
      sendIds,
    } = await this.getClickEventIdentifiers(campaign);

    const $match = {
      usr: { $in: identityIds },
      url: { $in: urlIds },
      job: { $in: sendIds },
    };
    // @todo This is being shut off to allow events just after the sent date to
    // display. Will still limit by the campaign start date.
    // const dateCriteria = this.createDateCriteria(campaign);
    // if (dateCriteria) $match.day = dateCriteria;
    if (campaign.startDate) $match.day = { $gte: campaign.startDate };

    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({ $addFields: { guidn: { $size: '$guids' } } });
    pipeline.push({
      $group: {
        _id: '$usr',
        urlIds: { $addToSet: '$url' },
        sendIds: { $addToSet: '$job' },
        clicks: { $sum: { $add: ['$n', '$guidn'] } },
      },
    });
    return pipeline;
  },

  async getEligibleIdentityIds(campaign, {
    urlIds,
    sendIds,
    suppressInactives = true,
    enforceMaxIdentities = true,
  } = {}) {
    const { maxIdentities } = campaign;

    const $match = {
      url: { $in: urlIds },
      job: { $in: sendIds },
      $or: [
        { 'guids.0': { $exists: true } },
        { n: { $gt: 0 } },
      ],
    };
    // @todo This is being shut off to allow events just after the sent date to
    // display. Will still limit by the campaign start date.
    // const dateCriteria = this.createDateCriteria(campaign);
    // if (dateCriteria) $match.day = dateCriteria;
    if (campaign.startDate) $match.day = { $gte: campaign.startDate };

    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({ $group: { _id: '$usr' } });

    const results = await EventEmailClick.aggregate(pipeline);

    // Must exclude by ineligible identities, then sort and set max limit.
    const exclusions = await this.buildIdentityExclusionCriteria(campaign, { suppressInactives });
    const criteria = {
      _id: { $in: results.map((r) => r._id) },
      ...exclusions,
    };

    const limit = enforceMaxIdentities ? (maxIdentities || 0) : 0;
    const identities = await Identity.find(criteria, { _id: 1 })
      .sort({ fieldCount: -1 }).limit(limit);
    return identities.map((o) => o._id);
  },

  /**
   * Get all eligible url and and send IDs for the provided campaign.
   * Will exclude sends/urls where the campaign's excluded urls match.
   *
   * @param {Campaign} campaign
   * @param {object} options
   */
  async getEligibleUrlAndSendIds(campaign) {
    const { email } = campaign;
    const { excludeUrls } = email;

    // Create the criteria for finding all url sends
    // This initially will not be restricted by the campaign's excluded urls.
    const criteria = await this.buildEmailSendUrlCriteria(campaign);

    const emailSendUrls = await EmailSendUrl.find(criteria, {
      sendId: 1,
      urlId: 1,
    });

    // Filter by removing excluded urls, and then reduce into a single object.
    return emailSendUrls.filter((emailSendUrl) => {
      const excluded = excludeUrls.find((e) => `${e.urlId}` === `${emailSendUrl.urlId}` && `${e.sendId}` === `${emailSendUrl.sendId}`);
      return !excluded;
    }).reduce((acc, emailSendUrl) => {
      const { urlId, sendId } = emailSendUrl;
      acc.urlIds.push(urlId);
      acc.sendIds.push(sendId);
      return acc;
    }, { urlIds: [], sendIds: [] });
  },

  /**
   * Builds the criteria for finding EmailSendUrls for the provided campaign.
   * This will restrict by the campaign's customer, tags and link types.
   * It will _not_ restrict by the campaign's excluded URLs.
   *
   * @param {Campaign} campaign
   * @param {object} options
   */
  async buildEmailSendUrlCriteria(campaign) {
    const { customerId, email } = campaign;

    // account for all child customers
    const childCustomerIds = await Customer.distinct('_id', { parentId: customerId });
    const customerIds = [customerId, ...childCustomerIds];

    const {
      tagIds,
      excludedTagIds,
      allowedLinkTypes,
      restrictToSentDate,
    } = email;

    // build tag query.
    const tagAnd = [];
    if (tagIds && tagIds.length) tagAnd.push({ tagIds: { $in: tagIds } });
    if (excludedTagIds && excludedTagIds.length) tagAnd.push({ tagIds: { $nin: excludedTagIds } });

    // load hosts for tags and customers
    const [customerHostIds, tagHostIds] = await Promise.all([
      ExtractedHost.distinct('_id', { customerId: { $in: customerIds } }),
      tagAnd.length ? ExtractedHost.distinct('_id', { $and: tagAnd }) : Promise.resolve([]),
    ]);

    // look for urls that have the requested customers or hosts with customers
    const customerOr = [];
    customerOr.push({ customerId: { $in: customerIds } });
    if (customerHostIds.length) customerOr.push({ resolvedHostId: { $in: customerHostIds } });

    // look for urls that have the requested tags or hosts with tags
    const tagOr = [];
    if (tagAnd.length) tagOr.push({ $and: tagAnd });
    if (tagHostIds.length) tagOr.push({ resolvedHostId: { $in: tagHostIds } });

    // require that the urls have the requested tags and the customers
    const $and = [{ $or: customerOr }];
    if (tagOr.length) $and.push({ $or: tagOr });

    // Now find all URLs associated with this campaign, that are eligible.
    // By eligible we mean have the correct customer, tags, and link types (where applicable).
    const urlCriteria = {
      $and,
      linkType: { $in: allowedLinkTypes },
    };

    const urls = await ExtractedUrl.find(urlCriteria, { _id: 1 });
    const urlIds = urls.map((url) => url._id);

    if (restrictToSentDate) {
      // Find the send URLs based on `send.startDate`.
      const criteria = {
        urlId: { $in: urlIds },
        isTestSend: false,
      };
      const dateCriteria = this.createDateCriteria(campaign);
      if (dateCriteria) criteria.sentDate = dateCriteria;
      return criteria;
    }

    // Find the send URLs based on when the click occurred.
    const $match = {
      url: { $in: urlIds },
      $or: [
        { 'guids.0': { $exists: true } },
        { n: { $gt: 0 } },
      ],
    };
    const dayCriteria = this.createDateCriteria(campaign);
    if (dayCriteria) $match.day = dayCriteria;

    const pipeline = [
      { $match },
      { $group: { _id: '$job' } },
    ];
    const result = await EventEmailClick.aggregate(pipeline);
    return {
      sendId: { $in: result.map((r) => r._id) },
      urlId: { $in: urlIds },
      isTestSend: false,
    };
  },

  async findAllUrlsForCampaign(campaign) {
    const criteria = await this.buildEmailSendUrlCriteria(campaign);
    const urlIds = await EmailSendUrl.distinct('urlId', criteria);
    return ExtractedUrl.find({ _id: { $in: urlIds } });
  },

  async findAllUrlSendsForCampaign(campaign) {
    const criteria = await this.buildEmailSendUrlCriteria(campaign);
    return EmailSendUrl.find(criteria).sort({ sentDate: 1 });
  },

  /**
   * Finds all identity IDs that are inactive or filtered for
   * the provided campaign.
   *
   * @param {Campaign} campaign
   * @param {object} options
   * @param {boolean} [options.suppressInactives=true]
   */
  async buildIdentityExclusionCriteria(campaign, { suppressInactives = true } = {}) {
    const { email } = campaign;
    const { identityFilters } = email;

    const customerIds = [campaign.customerId];
    const [childCustomers, excludedDomains] = await Promise.all([
      Customer.find({ parentId: campaign.customerId }, { _id: 1 }),
      ExcludedEmailDomain.distinct('domain'),
    ]);
    childCustomers.forEach((c) => customerIds.push(c._id));

    const criteria = suppressInactives ? {
      inactive: false,
      inactiveCustomerIds: { $nin: customerIds },
      inactiveCampaignIds: { $nin: [campaign._id] },
      ...(excludedDomains.length && { emailDomain: { $nin: excludedDomains } }),
    } : {};

    const filters = isArray(identityFilters) ? identityFilters : [];
    if (filters.length) {
      criteria.$and = filters.map((filter) => {
        // Add identity filters
        const { key, matchType, terms } = filter;
        const regexes = terms.filter((term) => term).map((term) => {
          const prefix = ['starts', 'matches'].includes(matchType) ? '^' : '';
          const suffix = matchType === 'matches' ? '$' : '';
          return new RegExp(`${prefix}${escapeRegex(term)}${suffix}`, 'i');
        });
        return { [key]: { $nin: regexes } };
      });
    }
    return criteria;
  },

  /**
   * Builds the lte/gte start/end date criteria.
   *
   * @param {?Date} params.startDate
   * @param {?Date} params.endDate
   */
  createDateCriteria({ startDate, endDate }) {
    return createDateCriteria({ startDate, endDate });
  },

  async buildEmailMetrics({ results, sort, sendIds }) {
    const sends = await EmailSend.find({ _id: { $in: sendIds } }, {
      deploymentId: 1,
      metrics: 1,
      rollupMetrics: 1,
    });

    const groups = {};
    sends.forEach((send) => {
      const {
        deploymentId,
        id,
        metrics,
        rollupMetrics,
      } = send;

      const dep = `${deploymentId}`;
      const job = `${id}`;

      const row = results.find((result) => `${result._id}` === `${id}`);
      const identities = row ? row.identityIds.length : 0;
      const clicks = row ? row.clicks : 0;

      const key = rollupMetrics ? dep : job;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        id,
        deploymentId,
        metrics,
        identities,
        clicks,
      });
    });

    const final = [];
    Object.keys(groups).forEach((key) => {
      const group = groups[key];
      const item = {
        sendId: group[0].id,
        deploymentId: group[0].deploymentId,
        identities: 0,
        clicks: 0,
        metrics: {
          sent: 0,
          delivered: 0,
          uniqueOpens: 0,
          uniqueClicks: 0,
          unsubscribes: 0,
          forwards: 0,
          bounces: 0,
        },
      };
      group.forEach((row) => {
        item.identities += row.identities;
        item.clicks += row.clicks;
        item.metrics.sent += row.metrics.sent;
        item.metrics.delivered += row.metrics.delivered;
        item.metrics.uniqueOpens += row.metrics.uniqueOpens;
        item.metrics.uniqueClicks += row.metrics.uniqueClicks;
        item.metrics.unsubscribes += row.metrics.unsubscribes;
        item.metrics.forwards += row.metrics.forwards;
        item.metrics.bounces += row.metrics.bounces;
      });
      item.advertiserClickRate = item.metrics.uniqueOpens
        ? (item.clicks / item.metrics.uniqueOpens) : 0;
      final.push(item);
    });
    const finalIds = final.map((f) => f.sendId);

    const sortedSends = await EmailSend.find({ _id: { $in: finalIds } }).sort({
      [sort.field]: sort.order,
    });

    return sortedSends.map((send) => {
      const row = final.find((f) => `${f.sendId}` === `${send.id}`);
      const {
        id,
        name,
        sentDate,
        url,
      } = send;
      const {
        metrics,
        identities,
        clicks,
        advertiserClickRate,
        deploymentId,
      } = row;
      return {
        send: {
          id,
          deploymentId,
          name,
          sentDate,
          url,
          metrics,
        },
        identities,
        clicks,
        advertiserClickRate,
      };
    });
  },
};
