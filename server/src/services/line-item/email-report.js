const escapeRegex = require('escape-string-regexp');
const moment = require('moment');
const { Types } = require('mongoose');
const Customer = require('../../models/customer');
const EmailSend = require('../../models/email-send');
const EmailSendUrl = require('../../models/email-send-url');
const EventEmailClick = require('../../models/events/email-click');
const ExcludedEmailDomain = require('../../models/excluded-email-domain');
const ExtractedHost = require('../../models/extracted-host');
const ExtractedUrl = require('../../models/extracted-url');
const Identity = require('../../models/identity');
const Order = require('../../models/order');
const createDateCriteria = require('../../utils/create-date-criteria');

const { isArray } = Array;
const { ObjectId } = Types;

module.exports = {

  /**
   * A qualified identity is one that:
   *
   * @todo This needs massive cleanup
   *
   * 1. Is not suppressed for the customer, the line item, or globally.
   * 2. Has all required fields via the line items `requiredFields` setting.
   * 3. Is not filtered by the line item's `identityFilters` setting.
   *
   * @param {*} lineitem
   * @param {*} params
   */
  async getQualifiedIdentityCount(lineitem, {
    urlIds,
    sendIds,
  }) {
    const [events, criteria] = await Promise.all([
      this.getEligibleIdentityIds(lineitem, { urlIds, sendIds }),
      this.buildIdentityExclusionCriteria(lineitem),
    ]);
    const ids = events.map((event) => event._id);
    criteria._id = { $in: ids };

    const qualified = await Identity.find(criteria, { _id: 1 });
    return {
      total: ids.length,
      qualified: qualified.length,
      scrubbed: ids.length - qualified.length,
    };
  },

  async getActiveIdentities(lineitem, {
    urlIds,
    sendIds,
  }) {
    const { requiredLeads } = lineitem;
    const [events, criteria] = await Promise.all([
      this.getEligibleIdentityIds(lineitem, { urlIds, sendIds }),
      this.buildIdentityExclusionCriteria(lineitem),
    ]);
    const ids = events.map((event) => event._id);
    criteria._id = { $in: ids };

    const docs = await Identity.find(criteria, { _id: 1 }).limit(requiredLeads);
    return docs.map((doc) => doc._id);
  },

  async getInactiveIdentities(lineitem, {
    urlIds,
    sendIds,
  }) {
    const [events, customerIds] = await Promise.all([
      this.getEligibleIdentityIds(lineitem, { urlIds, sendIds }),
      this.findCustomerIdsFor(lineitem),
    ]);
    const ids = events.map((event) => event._id);

    const criteria = {
      $or: [
        { inactive: true },
        { inactiveCustomerIds: { $in: customerIds } },
        { inactiveLineItemIds: { $in: [lineitem._id] } },
      ],
    };
    criteria._id = { $in: ids };

    const docs = await Identity.find(criteria, { _id: 1 });
    return docs.map((doc) => doc._id);
  },

  async getClickEventIdentifiers(lineitem) {
    const {
      urlIds,
      sendIds,
    } = await this.getEligibleUrlAndSendIds(lineitem);

    const identityIds = await this.getActiveIdentities(lineitem, {
      urlIds,
      sendIds,
    });
    return {
      identityIds,
      urlIds,
      sendIds,
    };
  },

  /**
   * Gets all eligible identity IDs, regardless if they qualify or not.
   *
   * @param {*} lineitem
   * @param {*} params
   */
  async getEligibleIdentityIds(lineitem, {
    urlIds,
    sendIds,
  } = {}) {
    const $match = {
      url: { $in: urlIds },
      job: { $in: sendIds },
      day: this.createEventDateCriteria(lineitem),
      $or: [
        { 'guids.0': { $exists: true } },
        { n: { $gt: 0 } },
      ],
    };

    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({ $group: { _id: '$usr', day: { $max: '$day' } } });
    pipeline.push({ $sort: { day: 1 } });

    return EventEmailClick.aggregate(pipeline);
  },

  async buildExportPipeline(lineitem) {
    const {
      identityIds,
      urlIds,
      sendIds,
    } = await this.getClickEventIdentifiers(lineitem);

    const $match = {
      usr: { $in: identityIds },
      url: { $in: urlIds },
      job: { $in: sendIds },
      day: this.createEventDateCriteria(lineitem),
    };

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

  /**
   * Builds criteria for finding identities that are inactive, filtered, or unqualified for
   * the provided lineitem.
   *
   * @param {LineItemEmail} lineitem
   */
  async buildIdentityExclusionCriteria(lineitem) {
    const [customerIds, excludedDomains] = await Promise.all([
      this.findCustomerIdsFor(lineitem),
      ExcludedEmailDomain.distinct('domain'),
    ]);

    const criteria = {
      inactive: false,
      inactiveCustomerIds: { $nin: customerIds },
      inactiveLineItemIds: { $nin: [lineitem._id] },
      ...(excludedDomains.length && { emailDomain: { $nin: excludedDomains } }),
    };

    const $and = this.createIdentityFilter(lineitem);
    if ($and.length) {
      criteria.$and = $and;
    }

    return criteria;
  },

  async findCustomerIdsFor(lineitem) {
    const { orderId } = lineitem;
    const order = await Order.findById(orderId, { customerId: 1 });
    const { customerId } = order;
    const customerIds = [customerId];
    const childCustomers = await Customer.find({ parentId: customerId }, { _id: 1 });
    childCustomers.forEach((c) => customerIds.push(c._id));
    return customerIds;
  },

  createIdentityFilter(lineitem) {
    const { identityFilters, requiredFields } = lineitem;

    const $and = [];
    const filters = isArray(identityFilters) ? identityFilters : [];
    filters.forEach((filter) => {
      // Add identity filters
      const { key, matchType, terms } = filter;
      const regexes = terms.filter((term) => term).map((term) => {
        const prefix = ['starts', 'matches'].includes(matchType) ? '^' : '';
        const suffix = matchType === 'matches' ? '$' : '';
        return new RegExp(`${prefix}${escapeRegex(term)}${suffix}`, 'i');
      });
      $and.push({ [key]: { $nin: regexes } });
    });

    const fields = isArray(requiredFields) ? requiredFields : [];
    fields.forEach((field) => {
      $and.push({ [field]: { $ne: '' } });
    });
    return $and;
  },

  /**
   *
   * @param {*} lineitem
   */
  async identityFieldProjection(lineitem) {
    const excludedFields = await lineitem.getExcludedFields();
    return excludedFields.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  },

  /**
   * Get all eligible url and and send IDs for the provided lineitem.
   *
   * @param {LineItemEmail} lineitem
   * @param {object} options
   */
  async getEligibleUrlAndSendIds(lineitem) {
    const { excludedUrls = [] } = lineitem;
    const urlData = await this.aggregateAllEligibleUrls(lineitem);

    // @todo This should be a part of the query criteria??
    const eligible = urlData.filter((emailSendUrl) => {
      const excluded = excludedUrls.find((e) => `${e.urlId}` === `${emailSendUrl.urlId}` && `${e.sendId}` === `${emailSendUrl.sendId}`);
      return !excluded;
    }).reduce((acc, emailSendUrl) => {
      const { urlId, sendId } = emailSendUrl;
      acc.urlIds.push(urlId);
      acc.sendIds.set(`${sendId}`, sendId);
      return acc;
    }, { urlIds: [], sendIds: new Map() });
    return {
      urlIds: eligible.urlIds,
      sendIds: [...eligible.sendIds.values()],
    };
  },

  async aggregateAllEligibleUrls(lineitem) {
    // Create the criteria for finding all url sends for the line item.
    const criteria = await this.buildEmailSendUrlCriteria(lineitem);

    const pipeline = [];
    pipeline.push({ $match: criteria });
    pipeline.push({
      $group: {
        _id: {
          deploymentId: '$deploymentId',
          sendId: '$sendId',
          urlId: '$urlId',
        },
      },
    });
    pipeline.push({
      $project: {
        _id: 0,
        deploymentId: '$_id.deploymentId',
        sendId: '$_id.sendId',
        urlId: '$_id.urlId',
      },
    });

    return EmailSendUrl.aggregate(pipeline);
  },

  async findAllUrlSendsForLineItem(lineitem) {
    const criteria = await this.buildEmailSendUrlCriteria(lineitem);
    return EmailSendUrl.find(criteria).sort({ sentDate: 1 });
  },

  /**
   * Builds the criteria for finding EmailSendUrls for the provided  lineitem.
   * This will restrict by the line item's customer, tags and link types.
   * It will _not_ restrict by the line item's excluded URLs.
   * It _will_ restrect by the line items email categories
   *
   * @param {LineItemEmail} lineitem
   * @param {object} options
   */
  async buildEmailSendUrlCriteria(lineitem) {
    const order = await Order.findById(lineitem.orderId, { customerId: 1 });
    const { customerId } = order;

    // account for all child customers
    const childCustomerIds = await Customer.distinct('_id', { parentId: customerId });
    const customerIds = [customerId, ...childCustomerIds];

    const {
      tagIds,
      excludedTagIds,
      linkTypes,
      categoryIds,
    } = lineitem;

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

    // Now find all URLs associated with this lineitem, that are eligible.
    // By eligible we mean have the correct customer, tags, and link types (where applicable).
    const urlCriteria = {
      $and,
      linkType: { $in: linkTypes },
    };

    const urls = await ExtractedUrl.find(urlCriteria, { _id: 1 });
    const urlIds = urls.map((url) => url._id);

    // For now, treat all lineitems as restricted.
    // This was a toggleable option for campaigns, but hasn't been added to lineitems yet.
    const restrictToSentDate = true;

    if (restrictToSentDate) {
      // Find the send URLs based on `send.startDate`.
      const criteria = {
        urlId: { $in: urlIds },
        isTestSend: false,
      };
      if (categoryIds && categoryIds.length) {
        criteria.categoryId = { $in: categoryIds.map((id) => ObjectId(id)) };
      }
      const dateCriteria = this.createDateCriteria(lineitem);
      if (dateCriteria) criteria.sentDate = dateCriteria;
      return criteria;
    }

    // Find the send URLs based on when the click occurred.
    // @todo Currently this will not execute...
    const $match = {
      url: { $in: urlIds },
      $or: [
        { 'guids.0': { $exists: true } },
        { n: { $gt: 0 } },
      ],
    };
    const dayCriteria = this.createDateCriteria(lineitem);
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

  /**
   * Builds the lte/gte start/end date criteria.
   *
   * @param {LineItemEmail} lineitem
   */
  createDateCriteria(lineitem) {
    const { range } = lineitem;
    return createDateCriteria({
      startDate: range.start,
      endDate: range.end,
    });
  },

  /**
   * For use when querying for event identities, where 72 hours
   * past the end date is allowed.
   * @param {*} lineitem
   */
  createEventDateCriteria(lineitem) {
    const { range } = lineitem;

    // Campaigns did not use the end to allow for events to appear
    // right after the email sent date.
    // This will restrict by 72 hours.
    const end = moment(range.end).add(3, 'days').toDate();
    return createDateCriteria({
      startDate: range.start,
      endDate: end,
    });
  },

  /**
   *
   * @param {*} param0
   */
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

    // @todo Determine if this should filter by 0 identities
    // @todo Find out why the math is wrong on totals?
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
