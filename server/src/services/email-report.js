const escapeRegex = require('escape-string-regexp');
const {
  Customer,
  ExcludedEmailDomain,
  ExtractedUrl,
  Identity,
  OmedaEmailClick,
  OmedaEmailDeploymentUrl,
} = require('../mongodb/models');

const { isArray } = Array;

module.exports = {
  /**
   * @param {Campaign} campaign
   * @param {object} options
   * @param {boolean} [options.suppressInactives=true]
   * @param {boolean} [options.enforceMaxIdentities=true]
   */
  async getClickEventIdentifiers(campaign, {
    suppressInactives = true,
    enforceMaxIdentities = true,
  } = {}) {
    const {
      urlIds,
      deploymentEntities,
    } = await this.getEligibleUrlsAndDeployments(campaign);

    const identityEntities = await this.getEligibleIdentityEntities(campaign, {
      suppressInactives,
      enforceMaxIdentities,
      urlIds,
      deploymentEntities,
    });

    return {
      identityEntities,
      urlIds,
      deploymentEntities,
    };
  },

  async identityFieldProjection(campaign) {
    const { email } = campaign;
    const excludeFields = await email.getExcludeFields();
    return excludeFields.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  },

  async buildExportPipeline(campaign) {
    const {
      identityEntities,
      urlIds,
      deploymentEntities,
    } = await this.getClickEventIdentifiers(campaign);

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
        _id: '$idt',
        urlIds: { $addToSet: '$url' },
        deploymentEntities: { $addToSet: '$dep' },
        clicks: { $sum: '$n' },
      },
    });
    return pipeline;
  },

  async getEligibleIdentityEntities(campaign, {
    urlIds,
    deploymentEntities,
    suppressInactives = true,
    enforceMaxIdentities = true,
  } = {}) {
    const { maxIdentities } = campaign;

    const $match = {
      url: { $in: urlIds },
      dep: { $in: deploymentEntities },
      date: { $gte: campaign.startDate },
    };

    const pipeline = [];
    pipeline.push({ $match });
    pipeline.push({ $group: { _id: '$idt' } });

    const results = await OmedaEmailClick.aggregate(pipeline);

    // Must exclude by ineligible identities, then sort and set max limit.
    const exclusions = await this.buildIdentityExclusionCriteria(campaign, { suppressInactives });
    const criteria = {
      entity: { $in: results.map((r) => r._id) },
      ...exclusions,
    };

    const limit = enforceMaxIdentities ? (maxIdentities || 0) : 0;
    const identities = await Identity.find(criteria, { entity: 1 })
      .sort({ fieldCount: -1 }).limit(limit);
    return identities.map((o) => o.entity);
  },

  /**
   * Get all eligible url and and deployment entities for the provided campaign.
   * Will exclude deployments/urls where the campaign's excluded urls match.
   *
   * @param {Campaign} campaign
   * @param {object} options
   */
  async getEligibleUrlsAndDeployments(campaign) {
    const { email } = campaign;
    const { excludeUrls } = email;

    // Create the criteria for finding all deployment urls
    // This initially will not be restricted by the campaign's excluded urls.
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign);

    const deploymentUrls = await OmedaEmailDeploymentUrl.find(criteria, {
      'deployment.entity': 1,
      'url._id': 1,
    });

    // Filter by removing excluded urls, and then reduce into a single object.
    return deploymentUrls.filter((deploymentUrl) => {
      const excluded = excludeUrls.find((e) => `${e.urlId}` === `${deploymentUrl.url._id}` && e.deploymentEntity === deploymentUrl.deployment.entity);
      return !excluded;
    }).reduce((o, deploymentUrl) => {
      const { url, deployment } = deploymentUrl;
      o.urlIds.push(url._id);
      o.deploymentEntities.push(deployment.entity);
      return o;
    }, { urlIds: [], deploymentEntities: [] });
  },

  /**
   * Builds the criteria for finding OmedaEmailDeploymentUrls for the provided campaign.
   * This will restrict by the campaign's customer, tags and link types.
   * It will _not_ restrict by the campaign's excluded URLs.
   *
   * @param {Campaign} campaign
   * @param {object} options
   */
  async buildEmailDeploymentUrlCriteria(campaign) {
    const { customerId, email } = campaign;

    // account for all child customers
    const childCustomerIds = await Customer.distinct('_id', { parentId: customerId, deleted: { $ne: true } });
    const customerIds = [customerId, ...childCustomerIds];

    const {
      tagIds,
      excludedTagIds,
      allowedLinkTypes,
      restrictToSentDate,
    } = email;

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

    // Now find all URLs associated with this campaign, that are eligible.
    // By eligible we mean have the correct customer, tags, and link types (where applicable).
    const criteria = {
      $and,
      linkType: { $in: allowedLinkTypes },
    };

    if (restrictToSentDate) {
      // Find the send URLs based on `deployment.startDate`.
      return {
        ...criteria,
        'deployment.sentDate': { $gte: campaign.startDate, $lte: campaign.endDate },
      };
    }

    const urlIds = await OmedaEmailDeploymentUrl.distinct('url._id', criteria);
    const $match = {
      url: { $in: urlIds },
      date: { $gte: campaign.startDate, $lte: campaign.endDate },
    };
    const pipeline = [
      { $match },
      { $group: { _id: '$dep' } },
    ];
    const result = await OmedaEmailClick.aggregate(pipeline);
    return {
      'deployment.entity': { $in: result.map((r) => r._id) },
      urlId: { $in: urlIds },
    };
  },

  async findAllUrlsForCampaign(campaign) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign);
    const urlIds = await OmedaEmailDeploymentUrl.distinct('url._id', criteria);
    return ExtractedUrl.find({ _id: { $in: urlIds } });
  },

  async getCampaignUrlCount(campaign) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign);
    return OmedaEmailDeploymentUrl.countDocuments(criteria);
  },

  async findAllDeploymentUrlsForCampaign(campaign) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign);
    return OmedaEmailDeploymentUrl.find(criteria).sort({ 'deployment.sentDate': 1 });
  },

  /**
   * Builds identity criteria for identities that should be excluded
   * based on inactive or filtered campaign rules.
   *
   * @param {Campaign} campaign
   * @param {object} options
   * @param {boolean} [options.suppressInactives=true]
   */
  async buildIdentityExclusionCriteria(campaign, { suppressInactives = true } = {}) {
    const { email } = campaign;
    const { identityFilters } = email;

    const customerIds = [campaign.customerId];
    const [childCustomerIds, excludedDomains] = await Promise.all([
      Customer.distinct('_id', { parentId: campaign.customerId, deleted: { $ne: true } }, { _id: 1 }),
      ExcludedEmailDomain.distinct('domain'),
    ]);
    customerIds.push(...childCustomerIds);

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
   * @todo restore or move
   */
  // async buildEmailMetrics({ results, sort, deploymentEntities }) {
  //   const deployments = await OmedaEmailDeployment.find({
  //     entity: { $in: deploymentEntities },
  //   }, {
  //     _id: 1,
  //     entity: 1,
  //   });

  //   const groups = {};
  //   deployments.forEach((send) => {
  //     const {
  //       deploymentId,
  //       id,
  //       metrics,
  //       rollupMetrics,
  //     } = send;

  //     const dep = `${deploymentId}`;
  //     const job = `${id}`;

  //     const row = results.find((result) => `${result._id}` === `${id}`);
  //     const identities = row ? row.identityIds.length : 0;
  //     const clicks = row ? row.clicks : 0;

  //     const key = rollupMetrics ? dep : job;
  //     if (!groups[key]) groups[key] = [];
  //     groups[key].push({
  //       id,
  //       deploymentId,
  //       metrics,
  //       identities,
  //       clicks,
  //     });
  //   });

  //   const final = [];
  //   Object.keys(groups).forEach((key) => {
  //     const group = groups[key];
  //     const item = {
  //       sendId: group[0].id,
  //       deploymentId: group[0].deploymentId,
  //       identities: 0,
  //       clicks: 0,
  //       metrics: {
  //         sent: 0,
  //         delivered: 0,
  //         uniqueOpens: 0,
  //         uniqueClicks: 0,
  //         unsubscribes: 0,
  //         forwards: 0,
  //         bounces: 0,
  //       },
  //     };
  //     group.forEach((row) => {
  //       item.identities += row.identities;
  //       item.clicks += row.clicks;
  //       item.metrics.sent += row.metrics.sent;
  //       item.metrics.delivered += row.metrics.delivered;
  //       item.metrics.uniqueOpens += row.metrics.uniqueOpens;
  //       item.metrics.uniqueClicks += row.metrics.uniqueClicks;
  //       item.metrics.unsubscribes += row.metrics.unsubscribes;
  //       item.metrics.forwards += row.metrics.forwards;
  //       item.metrics.bounces += row.metrics.bounces;
  //     });
  //     item.advertiserClickRate = item.metrics.uniqueOpens
  //       ? (item.clicks / item.metrics.uniqueOpens) : 0;
  //     final.push(item);
  //   });
  //   const finalIds = final.map((f) => f.sendId);

  //   const sortedSends = await EmailSend.find({ _id: { $in: finalIds } }).sort({
  //     [sort.field]: sort.order,
  //   });

  //   return sortedSends.map((send) => {
  //     const row = final.find((f) => `${f.sendId}` === `${send.id}`);
  //     const {
  //       id,
  //       name,
  //       sentDate,
  //       url,
  //     } = send;
  //     const {
  //       metrics,
  //       identities,
  //       clicks,
  //       advertiserClickRate,
  //       deploymentId,
  //     } = row;
  //     return {
  //       send: {
  //         id,
  //         deploymentId,
  //         name,
  //         sentDate,
  //         url,
  //         metrics,
  //       },
  //       identities,
  //       clicks,
  //       advertiserClickRate,
  //     };
  //   });
  // },
};
