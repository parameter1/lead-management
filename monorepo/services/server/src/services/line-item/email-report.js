const escapeRegex = require('escape-string-regexp');
const dayjs = require('../../dayjs');
const {
  Customer,
  Identity,
  OmedaEmailClick,
  OmedaEmailDeploymentUrl,
  Order,
} = require('../../mongodb/models');
const emailCampaignReport = require('../email-report');

const { isArray } = Array;

module.exports = {

  /**
   * A qualified identity is one that:
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
    deploymentEntities,
  }) {
    const [identityEntities, criteria] = await Promise.all([
      this.getEligibleIdentityEntities(lineitem, { urlIds, deploymentEntities }),
      this.buildIdentityExclusionCriteria(lineitem),
    ]);
    criteria.entity = { $in: identityEntities };

    const qualifiedCount = await Identity.countDocuments(criteria);
    return {
      total: identityEntities.length,
      qualified: qualifiedCount,
      scrubbed: identityEntities.length - qualifiedCount,
    };
  },

  async getActiveIdentityEntities(lineitem, {
    urlIds,
    deploymentEntities,
  }) {
    const { requiredLeads } = lineitem;
    const [identityEntities, criteria] = await Promise.all([
      this.getEligibleIdentityEntities(lineitem, { urlIds, deploymentEntities }),
      this.buildIdentityExclusionCriteria(lineitem, false),
    ]);
    criteria.entity = { $in: identityEntities };

    const docs = await Identity.find(criteria, { entity: 1 }).limit(requiredLeads);
    return docs.map((doc) => doc.entity);
  },

  async getInactiveIdentityEntities(lineitem, {
    urlIds,
    deploymentEntities,
  }) {
    const [identityEntities, criteria] = await Promise.all([
      this.getEligibleIdentityEntities(lineitem, { urlIds, deploymentEntities }),
      this.buildIdentityExclusionCriteria(lineitem, true),
    ]);
    criteria.entity = { $in: identityEntities };
    return Identity.distinct('entity', criteria);
  },

  async getClickEventIdentifiers(lineitem) {
    const {
      urlIds,
      deploymentEntities,
    } = await this.getEligibleUrlsAndDeployments(lineitem);

    const identityEntities = await this.getActiveIdentityEntities(lineitem, {
      urlIds,
      deploymentEntities,
    });
    return {
      identityEntities,
      urlIds,
      deploymentEntities,
    };
  },

  /**
   * Gets all eligible identity IDs, regardless if they qualify or not.
   *
   * @param {*} lineitem
   * @param {*} params
   */
  async getEligibleIdentityEntities(lineitem, {
    urlIds,
    deploymentEntities,
  } = {}) {
    const $match = {
      url: { $in: urlIds },
      dep: { $in: deploymentEntities },
      date: { $gte: lineitem.range.start, $lte: this.getEndDate(lineitem) },
    };

    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({ $group: { _id: '$idt' } });

    const results = await OmedaEmailClick.aggregate(pipeline);
    return results.map((r) => r._id);
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
  async buildIdentityExclusionCriteria(lineitem, active = false) {
    const customerIds = await this.findCustomerIdsFor(lineitem);
    const inOp = active ? '$in' : '$nin';
    const criteria = {
      inactive: active,
      inactiveCustomerIds: { [inOp]: customerIds },
      inactiveLineItemIds: { [inOp]: [lineitem._id] },
      domainExcluded: active ? true : { $ne: true },
    };

    const $and = this.createIdentityFilter(lineitem, active);

    if (active) {
      const $or = Object.keys(criteria).map((key) => ({ [key]: criteria[key] }));
      if ($and.length) $or.push(...$and);
      return { $or };
    }

    if ($and.length) criteria.$and = $and;
    return criteria;
  },

  async findCustomerIdsFor(lineitem) {
    const { orderId } = lineitem;
    const order = await Order.findById(orderId, { customerId: 1 });
    const { customerId } = order;
    const customerIds = [customerId];
    const childCustomerIds = await Customer.distinct('_id', { parentId: customerId, deleted: { $ne: true } });
    customerIds.push(...childCustomerIds);
    return customerIds;
  },

  createIdentityFilter(lineitem, active = false) {
    const { identityFilters, requiredFields } = lineitem;

    const op = active ? '$in' : '$nin';
    const ops = [];
    const filters = isArray(identityFilters) ? identityFilters : [];
    filters.forEach((filter) => {
      // Add identity filters
      const { key, matchType, terms } = filter;
      const regexes = terms.filter((term) => term).map((term) => {
        const prefix = ['starts', 'matches'].includes(matchType) ? '^' : '';
        const suffix = matchType === 'matches' ? '$' : '';
        return new RegExp(`${prefix}${escapeRegex(term)}${suffix}`, 'i');
      });
      ops.push({ [key]: { [op]: regexes } });
    });

    const fields = isArray(requiredFields) ? requiredFields : [];
    fields.forEach((field) => {
      ops.push({ [field]: { [op]: ['', null] } });
    });
    return ops;
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
  async getEligibleUrlsAndDeployments(lineitem) {
    const { excludedUrls = [] } = lineitem;

    // Create the criteria for finding all deployment urls
    // This initially will not be restricted by the campaign's excluded urls.
    const criteria = await this.buildEmailDeploymentUrlCriteria(lineitem);

    const deploymentUrls = await OmedaEmailDeploymentUrl.find(criteria, {
      'deployment.entity': 1,
      'url._id': 1,
    });

    // Filter by removing excluded urls, and then reduce into a single object.
    return deploymentUrls.filter((deploymentUrl) => {
      const excluded = excludedUrls.find((e) => `${e.urlId}` === `${deploymentUrl.url._id}` && e.deploymentEntity === deploymentUrl.deployment.entity);
      return !excluded;
    }).reduce((o, deploymentUrl) => {
      const { url, deployment } = deploymentUrl;
      o.urlIds.push(url._id);
      o.deploymentEntities.push(deployment.entity);
      return o;
    }, { urlIds: [], deploymentEntities: [] });
  },

  async findAllDeploymentUrlsForLineItem(lineitem) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(lineitem);
    return OmedaEmailDeploymentUrl.find(criteria).sort({ 'deployment.sentDate': 1 });
  },

  /**
   * Builds the criteria for finding OmedaEmailDeploymentUrls for the provided lineitem.
   * This will restrict by the line item's customer, tags, link types and deployment type entities.
   * It will _not_ restrict by the line item's excluded URLs.
   *
   * @param {LineItemEmail} lineitem
   * @param {object} options
   */
  async buildEmailDeploymentUrlCriteria(lineitem) {
    const order = await Order.findById(lineitem.orderId, { customerId: 1 });
    const { customerId } = order;

    // account for all child customers
    const childCustomerIds = await Customer.distinct('_id', { parentId: customerId, deleted: { $ne: true } });
    const customerIds = [customerId, ...childCustomerIds];

    const {
      tagIds,
      excludedTagIds,
      linkTypes,
      deploymentTypeEntities,
    } = lineitem;

    const $and = [];
    // look for urls that have the requested customers or hosts with customers
    $and.push({
      $or: [
        { customerId: { $in: customerIds } },
        { 'host.customerId': { $in: customerIds } },
      ],
    });

    // look for urls that have the requested tags or hosts with tags
    if (tagIds && tagIds.length) {
      $and.push({
        $or: [
          { tagIds: { $in: tagIds } },
          { 'host.tagIds': { $in: tagIds } },
        ],
      });
    }
    if (excludedTagIds && excludedTagIds.length) {
      $and.push({
        $or: [
          { tagIds: { $nin: excludedTagIds } },
          { 'host.tagIds': { $nin: excludedTagIds } },
        ],
      });
    }

    // Now find all URLs associated with this line item, that are eligible.
    // By eligible we mean have the correct customer, tags, and link types (where applicable).
    return {
      $and,
      linkType: { $in: linkTypes },
      'deployment.sentDate': { $gte: lineitem.range.start, $lte: this.getEndDate(lineitem) },
      ...(deploymentTypeEntities.length && { 'deployment.typeEntity': { $in: deploymentTypeEntities } }),
    };
  },

  getEndDate(lineitem) {
    return dayjs(lineitem.range.end).add(7, 'days').toDate();
  },

  /**
   *
   * @param {*} param0
   */
  async buildEmailMetrics({ results, sort, deploymentEntities }) {
    return emailCampaignReport.buildEmailMetrics({ results, sort, deploymentEntities });
  },
};
