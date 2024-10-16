const { getAsArray } = require('@parameter1/utils');
const escapeRegex = require('escape-string-regexp');
const {
  Campaign,
  Customer,
  ExcludedEmailDomain,
  ExtractedUrl,
  Identity,
  OmedaEmailClick,
  OmedaEmailDeploymentUrl,
  OmedaEmailDeployment,
} = require('../mongodb/models');
const { buildClickFilter } = require('../utils/email-clicks');

const { isArray } = Array;

const usesOmeda = new Set(['lynchm', 'indm']);

/**
 * @param {object} params
 * @param {import("../mongodb/schema/campaign").EmailCampaignClickRule[]} [params.clickRules]
 * @param {Date} [params.createdAt]
 * @param {Date} [params.startDate]
 * @param {LeadsTenant} params.tenant
 * @returns
 */
const getValidClickCriteria = ({
  clickRules,
  createdAt,
  startDate,
  tenant,
} = {}) => {
  if (!tenant) throw new Error('Tenant configuration was not passed!');
  const codes = getAsArray(tenant, 'doc.omeda.disallowedUnrealClickCodes');

  if (clickRules?.length && usesOmeda.has(tenant.key)) {
    /** @type {import("../utils/email-clicks").BuildClickFilterParams} */
    const params = {
      secondsSinceSentTime: clickRules
        .reduce((o, { seconds = 0, allowUnrealCodes = [] }) => ({
          ...o,
          [seconds]: {
            allowUnrealCodes: [
              ...allowUnrealCodes,
              ...(o[seconds] ? o[seconds].allowUnrealCodes : []),
            ],
          },
        }), {}),
    };
    return buildClickFilter(params);
  }

  const date = createdAt || startDate;

  if (
    date && date >= new Date('2024-06-01')
    && ['indm', 'lynchm'].includes(tenant.key)
  ) {
    return buildClickFilter({
      secondsSinceSentTime: {
        300: { allowUnrealCodes: [1, 3, 10] },
      },
    });
  }
  if (codes.length) {
    return {
      $or: [
        { 'invalid.0': { $exists: false } },
        { 'invalid.code': { $nin: codes.sort((a, b) => a - b) } },
      ],
    };
  }
  return {
    n: { $gt: 0 },
    'invalid.0': { $exists: false },
  };
};

module.exports = {
  getValidClickCriteria,

  /**
   * @param {Campaign} campaign
   * @param {LeadsTenant} tenant
   * @param {object} options
   * @param {BuildClickFilterParams} [options.customClickFilterParams]
   * @param {boolean} [options.suppressInactives=true]
   * @param {boolean} [options.enforceMaxIdentities=true]
   * @param {Date} [options.starting]
   * @param {Date} [options.ending]
   */
  async getClickEventIdentifiers(campaign, tenant, {
    customClickFilterParams,
    ending,
    enforceMaxIdentities = true,
    starting,
    suppressInactives = true,
  } = {}) {
    const {
      urlIds,
      deploymentEntities,
    } = await this.getEligibleUrlsAndDeployments(campaign, { starting, ending });

    const identityEntities = await this.getEligibleIdentityEntities(campaign, tenant, {
      customClickFilterParams,
      deploymentEntities,
      enforceMaxIdentities,
      suppressInactives,
      urlIds,
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

  async buildExportPipeline(campaign, tenant) {
    const {
      identityEntities,
      urlIds,
      deploymentEntities,
    } = await this.getClickEventIdentifiers(campaign, tenant);

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
        clicks: { $sum: { $cond: [{ $gt: ['$n', 0] }, '$n', 1] } },
      },
    });
    return pipeline;
  },

  /**
   * @param {Campaign} campaign
   * @param {LeadsTenant} tenant
   * @param {object} params
   * @param {BuildClickFilterParams} [params.customClickFilterParams]
   * @param {string[]} params.deploymentEntities
   * @param {boolean} [params.enforceMaxIdentities=true]
   * @param {boolean} [params.suppressInactives=true]
   * @param {import("mongodb").ObjectId[]} params.urlIds
   * @returns
   */
  async getEligibleIdentityEntities(campaign, tenant, {
    customClickFilterParams,
    deploymentEntities,
    enforceMaxIdentities = true,
    suppressInactives = true,
    urlIds,
  } = {}) {
    const { maxIdentities } = campaign;
    const { enforceMaxEmailDomains } = campaign.email;

    const clickFilter = customClickFilterParams
      ? buildClickFilter(customClickFilterParams)
      : getValidClickCriteria({
        clickRules: campaign.email?.clickRules,
        createdAt: campaign.createdAt,
        tenant,
      });

    const $match = {
      date: { $gte: campaign.startDate },
      url: { $in: urlIds },
      dep: { $in: deploymentEntities },
      ...clickFilter,
    };

    const pipeline = [];
    pipeline.push({ $match });
    if (enforceMaxEmailDomains) pipeline.push(...this.getEmailDomainAggregationStages());
    pipeline.push({ $group: { _id: null, entities: { $addToSet: '$idt' } } });

    const [result] = await OmedaEmailClick.aggregate(pipeline);

    // Must exclude by ineligible identities, then sort and set max limit.
    const exclusions = await this.buildIdentityExclusionCriteria(campaign, { suppressInactives });
    const criteria = {
      entity: { $in: result && result.entities ? result.entities : [] },
      ...exclusions,
    };

    const limit = enforceMaxIdentities ? (maxIdentities || 0) : 0;
    const identities = await Identity.find(criteria, { entity: 1 })
      .sort({ fieldCount: -1 }).limit(limit);
    return identities.map((o) => o.entity);
  },

  getEmailDomainAggregationStages() {
    const publicDomains = [
      'aol.com',
      'apple.com',
      'att.net',
      'bellsouth.net',
      'comcast.net',
      'gmail.com',
      'googlemail.com',
      'hotmail.com',
      'icloud.com',
      'msn.com',
      'outlook.com',
      'sbcglobal.net',
      'verizon.net',
      'yahoo.com',
    ];

    return [
      // get each unique url clicked per deployment for each identity
      { $group: { _id: { idt: '$idt', url: '$url', dep: '$dep' } } },
      // group by all unique deployment url clicks by identity
      {
        $group: {
          _id: '$_id.idt',
          unqClicks: { $push: { dep: '$_id.dep', url: '$_id.url' } },
        },
      },
      // lookup each identity and pull each email domain
      {
        $lookup: {
          from: 'identities',
          localField: '_id',
          foreignField: 'entity',
          as: 'identity',
        },
      },
      { $unwind: '$identity' },
      { $project: { unqClicks: 1, emailDomain: '$identity.emailDomain' } },
      { $unwind: '$unqClicks' },
      // group unique deployment url click for each email domain and track unique identites
      // with the matching domain
      {
        $group: {
          _id: { emailDomain: '$emailDomain' },
          identities: { $addToSet: '$_id' },
        },
      },
      // count total number of unique entites per email domain
      { $addFields: { identityCount: { $size: '$identities' } } },
      // if more than 3 identities of the same domain were found, only include the first identity
      // otherwise include all identities
      {
        $project: {
          idt: {
            $cond: {
              if: { $lte: ['$identityCount', 2] },
              then: '$identities',
              else: {
                $cond: {
                  if: { $in: ['$_id.emailDomain', publicDomains] },
                  then: '$identities',
                  else: { $slice: ['$identities', 2] },
                },
              },
            },
          },
          identityCount: 1,
        },
      },

      // return the unique set of identities
      { $unwind: '$idt' },
    ];
  },

  /**
   * Get all eligible url and and deployment entities for the provided campaign.
   * Will exclude deployments/urls where the campaign's excluded urls match.
   *
   * @param {Campaign} campaign
   * @param {object} options
   * @param {Date} [options.starting]
   * @param {Date} [options.ending]
   */
  async getEligibleUrlsAndDeployments(campaign, { starting, ending } = {}) {
    const { email } = campaign;
    const { excludeUrls } = email;

    // Create the criteria for finding all deployment urls
    // This initially will not be restricted by the campaign's excluded urls.
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign, { starting, ending });

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

  async getCampaignIdsWithDeployments(criteria, { starting, ending } = {}) {
    const campaigns = await Campaign.find(criteria);
    const campaignIds = await Promise.all(campaigns.map(async (campaign) => {
      const { deploymentEntities } = await this.getEligibleUrlsAndDeployments(campaign, {
        starting,
        ending,
      });
      return deploymentEntities.length ? campaign._id : null;
    }));
    return campaignIds.filter((id) => id);
  },

  /**
   * Builds the criteria for finding OmedaEmailDeploymentUrls for the provided campaign.
   * This will restrict by the campaign's customer, tags and link types.
   * It will _not_ restrict by the campaign's excluded URLs.
   *
   * @param {Campaign} campaign
   * @param {object} options
   * @param {Date} [options.starting]
   * @param {Date} [options.ending]
   */
  async buildEmailDeploymentUrlCriteria(campaign, { starting, ending } = {}) {
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

    if (starting || ending) {
      // Find the send URLs where the `deployment.sentDate` is between the provided range
      return {
        ...criteria,
        'deployment.sentDate': {
          ...(starting && { $gte: starting }),
          ...(ending && { $lte: ending }),
        },
      };
    }

    if (restrictToSentDate) {
      // Find the send URLs based on `deployment.sentDate`.
      return {
        ...criteria,
        'deployment.sentDate': { $gte: campaign.startDate, $lte: campaign.endDate },
      };
    }

    const urlIds = await OmedaEmailDeploymentUrl.distinct('url._id', criteria);
    const $match = {
      url: { $in: urlIds },
      // use the provided starting/ending date range.
      // if not provided, use the campaign start/end date
      ...((starting || ending) && {
        date: { ...(starting && { $gte: starting }), ...(ending && { $lte: ending }) },
      }),
      ...((!starting && !ending) && {
        date: { $gte: campaign.startDate, $lte: campaign.endDate },
      }),
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

  async findAllUrlsForCampaign(campaign, { starting, ending } = {}) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign, { starting, ending });
    const urlIds = await OmedaEmailDeploymentUrl.distinct('url._id', criteria);
    return ExtractedUrl.find({ _id: { $in: urlIds } });
  },

  async getCampaignUrlCount(campaign, { starting, ending } = {}) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign, { starting, ending });
    return OmedaEmailDeploymentUrl.countDocuments(criteria);
  },

  async findAllDeploymentUrlsForCampaign(campaign, { starting, ending } = {}) {
    const criteria = await this.buildEmailDeploymentUrlCriteria(campaign, { starting, ending });
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
      Customer.distinct('_id', { parentId: campaign.customerId, deleted: { $ne: true } }),
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
   *
   */
  async buildEmailMetrics({ results, sort, deploymentEntities }) {
    const resultMap = results.reduce((map, result) => {
      map.set(result._id, {
        entity: result._id,
        identities: result.identityEntities.length,
        clicks: result.clicks,
      });
      return map;
    }, new Map());

    const metricMap = OmedaEmailDeployment.metricMap();

    const docs = await OmedaEmailDeployment.find({
      entity: { $in: deploymentEntities },
    }).sort({ [sort.field]: sort.order });
    const reduced = docs.reduce((o, doc) => {
      const data = resultMap.get(doc.entity);
      const identities = data ? data.identities : 0;
      const clicks = data ? data.clicks : 0;

      const uniqueOpens = doc.get('omeda.UniqueOpens');
      const advertiserClickRate = data && uniqueOpens ? data.clicks / uniqueOpens : 0;
      o.deployments.push({
        identities,
        clicks,
        advertiserClickRate,
        deployment: doc,
      });
      const totals = {
        identities: o.totals.identities + identities,
        clicks: o.totals.clicks + clicks,
        sends: o.totals.sends + 1,
        metrics: {},
      };
      metricMap.forEach((omedaKey, ourKey) => {
        const value = doc.get(`omeda.${omedaKey}`) || 0;
        totals.metrics[ourKey] = o.totals.metrics[ourKey] + value;
      });
      return { ...o, totals };
    }, {
      deployments: [],
      totals: {
        identities: 0,
        sends: 0,
        clicks: 0,
        metrics: Array.from(metricMap, ([ourKey]) => ourKey).reduce((o, key) => ({
          ...o,
          [key]: 0,
        }), {}),
      },
    });
    const {
      uniqueOpens,
      sent,
      delivered,
      uniqueClicks,
    } = reduced.totals.metrics;
    reduced.totals.advertiserClickRate = uniqueOpens ? reduced.totals.clicks / uniqueOpens : 0;

    reduced.totals.metrics.deliveryRate = sent ? delivered / sent : 0;
    reduced.totals.metrics.openRate = delivered ? uniqueOpens / delivered : 0;
    reduced.totals.metrics.clickToDeliveredRate = delivered
      ? uniqueClicks / delivered : 0;
    reduced.totals.metrics.clickToOpenRate = uniqueOpens
      ? uniqueClicks / uniqueOpens : 0;
    return reduced;
  },
};

/**
 * @typedef {import("@lead-management/tenant-loader").LeadsTenant} LeadsTenant
 * @typedef {import("../utils/email-clicks").BuildClickFilterParams} BuildClickFilterParams
 */
