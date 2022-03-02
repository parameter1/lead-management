const { gql, UserInputError } = require('apollo-server-express');
const { get } = require('@parameter1/utils');
const fetch = require('node-fetch');
const csvToJson = require('csvtojson');
const dayjs = require('../../dayjs');
const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const campaignLineItemCriteria = require('../../gam-graphql/campaign-line-item-criteria');
const gamLoadMany = require('../utils/gam-load-many');
const emptyConnection = require('../../gam-graphql/empty-connection');
const {
  AdCreativeTracker,
  Campaign,
  Identity,
} = require('../../mongodb/models');
// const FormRepo = require('../../repos/form');
const emailReportService = require('../../services/email-report');
const adReportService = require('../../services/ad-report');
const identityAttributes = require('../../services/identity-attributes');
const redis = require('../../redis');
const getBrightcoveReport = require('../utils/brightcove-get-report');

const { isArray } = Array;

const hasKeys = (value) => Boolean(Object.keys(value).length);

const calcMax = (auth, max) => {
  if (!auth.isAdmin() && (!max || max < 1 || max > 200)) return 200;
  if (auth.isAdmin() && (!max || max < 0)) return 0;
  return max;
};

const findEmailCampaign = async (id) => {
  const record = await Campaign.findOne({ 'email._id': id || null, deleted: false });
  if (!record) throw new Error(`No campaign record found for ID ${id}.`);
  return record;
};

const findFormCampaign = async (id) => {
  const record = await Campaign.findOne({ 'forms._id': id || null, deleted: false });
  if (!record) throw new Error(`No campaign record found for ID ${id}.`);
  return record;
};

const findAdCampaign = async (id) => {
  const record = await Campaign.findOne({ 'ads._id': id || null, deleted: false });
  if (!record) throw new Error(`No campaign record found for ID ${id}.`);
  return record;
};

const handleExcludedFields = (excludeFields, auth) => {
  let fields = [];
  if (isArray(excludeFields)) {
    fields = fields.concat(excludeFields);
  }
  if (!auth.isAdmin()) {
    const toRestrict = identityAttributes.filter((f) => f.adminOnly).map((f) => f.key);
    fields = fields.concat(toRestrict);
  }
  return [...new Set(fields)];
};

const pollReportStatus = async ({ reportJobId, gam }) => {
  const { data } = await gam({
    document: gql`
      query CheckLineItemReportStatus($reportJobId: BigInt!) {
        getReportJobStatus(input: { reportJobId: $reportJobId })
      }
    `,
    variables: { reportJobId },
  });
  const { getReportJobStatus: status } = data;
  if (status === 'IN_PROGRESS') return pollReportStatus({ reportJobId, gam });
  if (status === 'COMPLETED') return true;
  if (status === 'FAILED') throw new Error('Report creation failed!');
  throw new Error(`Unknown report status encountered: '${status}'`);
};

module.exports = {
  /**
   *
   */
  CampaignConnection: paginationResolvers.connection,

  /**
   *
   */
  EmailCampaignIdentityConnection: paginationResolvers.connection,

  /**
   *
   */
  AdCampaignIdentityConnection: paginationResolvers.connection,

  /**
   *
   */
  Campaign: {
    customer: (campaign, _, { loaders }) => loaders.customer.load(campaign.customerId),

    salesRep: ({ salesRepId }, _, { loaders }) => {
      if (!salesRepId) return null;
      return loaders.user.load(salesRepId);
    },

    range: ({ startDate, endDate }) => ({ start: startDate, end: endDate }),

    gamLineItems: async (campaign, { input }, context, info) => {
      const { loaders } = context;
      const { startDate, endDate } = campaign;
      const { gamAdvertiserIds } = await loaders.customer.load(campaign.customerId);
      if (!isArray(gamAdvertiserIds) || !gamAdvertiserIds.length) return emptyConnection();
      return gamLoadMany({
        ...input,
        type: 'lineItem',
        criteria: campaignLineItemCriteria({ startDate, endDate, gamAdvertiserIds }),
        context,
        info,
      });
    },

    /**
     * @todo need to determine how to exhaust the connection when paginated
     */
    gamLineItemReport: async (campaign, _, context, info) => {
      const { loaders, gam } = context;
      const { startDate, endDate } = campaign;

      const excludedIds = campaign.get('adMetrics.excludedGAMLineItemIds');
      const filterResponse = (rows) => rows.filter((row) => {
        const lineItemId = get(row, 'Dimension.LINE_ITEM_ID');
        return !excludedIds.includes(lineItemId);
      });

      const emptyResponse = [];

      const cacheKey = `campaign:gam-line-item-report:${campaign.id}`;

      const setToCache = async (result) => {
        const data = JSON.stringify(result);
        // store for one hour
        await redis.setex(cacheKey, 60 * 60, data);
      };

      const fromCache = await redis.get(cacheKey);
      if (fromCache) return filterResponse(JSON.parse(fromCache));

      const { gamAdvertiserIds } = await loaders.customer.load(campaign.customerId);
      if (!isArray(gamAdvertiserIds) || !gamAdvertiserIds.length) {
        await setToCache(emptyResponse);
        return emptyResponse;
      }
      const { nodes } = await gamLoadMany({
        type: 'lineItem',
        criteria: campaignLineItemCriteria({ startDate, endDate, gamAdvertiserIds }),
        limit: 500,
        context,
        info,
        fields: 'nodes { id }',
      });
      if (!nodes.length) {
        await setToCache(emptyResponse);
        return emptyResponse;
      }
      const lineItemIds = nodes.map((node) => node.id);

      const now = new Date();
      const variables = {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        // GAM does not support end dates greater than the current date
        endDate: dayjs(endDate > now ? now : endDate).format('YYYY-MM-DD'),
        query: `WHERE LINE_ITEM_ID IN (${lineItemIds.join(',')})`,
      };

      const { data: jobData } = await gam({
        document: gql`
          query RunLineItemReportJob($startDate: GAMDate!, $endDate: GAMDate!, $query: String!) {
            runReportJob(input: {
              reportJob: {
                reportQuery: {
                  dimensions: [ADVERTISER_ID, ADVERTISER_NAME, ORDER_ID, ORDER_NAME, LINE_ITEM_ID, LINE_ITEM_NAME, LINE_ITEM_TYPE, CREATIVE_TYPE, CREATIVE_SIZE]
                  dimensionAttributes: [LINE_ITEM_START_DATE_TIME, LINE_ITEM_END_DATE_TIME]
                  columns: [AD_SERVER_IMPRESSIONS, AD_SERVER_CLICKS, AD_SERVER_CTR]
                  dateRangeType: CUSTOM_DATE
                  startDate: $startDate
                  endDate: $endDate
                  statement: { query: $query }
                }
              }
            }) {
              id
            }
          }
        `,
        variables,
      });
      const { id: reportJobId } = jobData.runReportJob;
      await pollReportStatus({ reportJobId, gam });
      const { data: downloadData } = await gam({
        document: gql`
          query CheckLineItemReportDownload($reportJobId: BigInt!) {
            getReportDownloadUrlWithOptions(input: {
              reportJobId: $reportJobId
              reportDownloadOptions: { exportFormat: CSV_DUMP, useGzipCompression: false }
            })
          }
        `,
        variables: { reportJobId },
      });
      const { getReportDownloadUrlWithOptions: downloadUrl } = downloadData;
      const res = await fetch(downloadUrl, { method: 'GET' });
      const json = await csvToJson().fromStream(res.body);
      await setToCache(json);
      return filterResponse(json);
    },

    /**
     *
     */
    brightcoveVideoReport: async (campaign, _, { brightcove, loaders }) => {
      const { startDate, endDate } = campaign;
      const excludedIds = campaign.get('adMetrics.excludedGAMLineItemIds');
      const { brightcoveVideoIds } = await loaders.customer.load(campaign.customerId);
      const emptyResponse = {
        totalCount: 0,
        nodes: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      };
      if (!brightcoveVideoIds || !brightcoveVideoIds.length) return emptyResponse;
      const videoIds = brightcoveVideoIds.filter((id) => !excludedIds.includes(id));
      if (!videoIds.length) return emptyResponse;

      const now = new Date();

      return getBrightcoveReport({
        dimensions: ['video'],
        where: [{ key: 'video', values: videoIds }],
        fields: [
          'video_name',
          'video_impression',
          'video_view',
          'engagement_score',
          'video_engagement_25',
          'video_engagement_50',
          'video_engagement_75',
          'video_engagement_100',
          'video_percent_viewed',
        ],
        sort: [{ field: 'video_view', order: 'desc' }],
        limit: 100,
        from: startDate,
        to: endDate > now ? now : endDate,
      }, { brightcove });
    },
  },

  /**
   *
   */
  CampaignAdMetrics: {
    /**
     *
     */
    excludedGAMLineItemIds: ({ excludedGAMLineItemIds: ids }) => (isArray(ids) ? ids : []),
  },

  /**
   *
   */
  EmailCampaign: {
    tags: ({ tagIds }, _, { loaders }) => loaders.tag.loadMany(tagIds),
    excludedTags: ({ excludedTagIds }, _, { loaders }) => loaders.tag.loadMany(excludedTagIds),

    identityAttributes: async (emailCampaign) => {
      const excludedFields = await emailCampaign.getExcludeFields();
      return identityAttributes.filter(({ key }) => !excludedFields.includes(key));
    },

    /**
     * @todo find a way to not re-query the campaign here.
     */
    urlCount: async (emailCampaign) => {
      const { id } = emailCampaign;
      const campaign = await Campaign.findOne({ 'email._id': id });
      if (!campaign) return 0;
      return emailReportService.getCampaignUrlCount(campaign);
    },

    /**
     * @todo find a way to not re-query the campaign here.
     */
    urlGroups: async (emailCampaign) => {
      const { id } = emailCampaign;
      const campaign = await Campaign.findOne({ 'email._id': id });
      if (!campaign) return [];

      const excludeUrls = emailCampaign.excludeUrls || [];
      const deploymentUrls = await emailReportService.findAllDeploymentUrlsForCampaign(campaign);
      const map = deploymentUrls.reduce((m, deploymentUrl) => {
        const { deployment } = deploymentUrl;
        const { _id: urlId } = deploymentUrl.url;
        if (!m.has(`${urlId}`)) m.set(`${urlId}`, new Map());
        m.get(`${urlId}`).set(deployment.entity, deployment);
        return m;
      }, new Map());

      const arr = [];
      map.forEach((deployments, urlId) => {
        arr.push({ urlId, deployments, excludeUrls });
      });
      return arr;
    },

    excludeUrls: (emailCampaign) => {
      if (!Array.isArray(emailCampaign.excludeUrls)) return [];
      return emailCampaign;
    },

    excludeFields: (emailCampaign) => emailCampaign.getExcludeFields(),

    /**
     * @todo find a way to not re-query the campaign here.
     */
    hasDeployments: async (emailCampaign) => {
      const { id } = emailCampaign;
      const campaign = await Campaign.findOne({ 'email._id': id });
      if (!campaign) return false;
      const {
        deploymentEntities,
      } = await emailReportService.getEligibleUrlsAndDeployments(campaign);
      return Boolean(deploymentEntities.length);
    },
  },

  /**
   *
   */
  EmailCampaignExcludedUrl: {
    url: (excluded, _, { loaders }) => loaders.extractedUrl.load(excluded.urlId),
    deployment: (excluded, _, { loaders }) => loaders
      .emailDeploymentEntity.load(excluded.deploymentEntity),
  },

  /**
   *
   */
  EmailCampaignUrlGroup: {
    url: (urlGroup, _, { loaders }) => loaders.extractedUrl.load(urlGroup.urlId),
    deploymentGroups: ({ urlId, deployments, excludeUrls }) => {
      const arr = [];
      deployments.forEach((deployment) => {
        const { entity } = deployment;
        const excluded = excludeUrls.find((e) => `${e.urlId}` === `${urlId}` && e.deploymentEntity === entity);
        arr.push({
          entity,
          active: !excluded,
        });
      });
      return arr;
    },
  },

  /**
   *
   */
  EmailCampaignUrlDeploymentGroup: {
    deployment: ({ entity }, _, { loaders }) => loaders.emailDeploymentEntity.load(entity),
  },

  /**
   *
   */
  AdCampaign: {
    tags: ({ tagIds }, _, { loaders }) => loaders.tag.loadMany(tagIds),
    trackers: async (adCampaign) => {
      const { id } = adCampaign;
      const campaign = await Campaign.findOne({ 'ads._id': id });
      if (!campaign) return [];
      return adReportService.findAllTrackersForCampaign(campaign);
    },
    identityAttributes: (adCampaign) => {
      const excludedFields = adCampaign.excludeFields || [];
      return identityAttributes.filter(({ key }) => !excludedFields.includes(key));
    },
    excludeTrackers: (adCampaign) => {
      const { excludeTrackerIds } = adCampaign;
      if (!Array.isArray(excludeTrackerIds)) return [];
      return AdCreativeTracker.find({ _id: { $in: excludeTrackerIds } });
    },
    hasIdentities: async (adCampaign) => {
      const { id } = adCampaign;
      const campaign = await Campaign.findOne({ 'ads._id': id });
      if (!campaign) return false;
      const identityIds = await adReportService.getEligibleIdentityIds(campaign);
      return Boolean(identityIds.length);
    },
  },

  /**
   * @todo restore
   */
  // FormCampaign: {
  //   forms: async (formCampaign, { refreshEntries }) => {
  //     const { id, excludeFormIds } = formCampaign;
  //     const campaign = await Campaign.findOne({ 'forms._id': id });

  //     const forms = await FormRepo.getEligibleCampaignForms(campaign, { refreshEntries });
  //     const exclude = Array.isArray(excludeFormIds)
  //       ? excludeFormIds.map((formId) => `${formId}`) : [];
  //     return forms
  //       .map((form) => ({ id: form.id, form, active: !exclude.includes(`${form.id}`) }));
  //   },
  // },

  /**
   *
   */
  Query: {
    /**
     *
     */
    campaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Campaign.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    campaignByHash: async (root, { hash }) => {
      const record = await Campaign.findOne({ hash: hash || null, deleted: false });
      if (!record) throw new Error(`No campaign found for hash '${hash}'`);
      return record;
    },

    emailCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const campaign = await findEmailCampaign(id);
      return campaign.email;
    },

    /**
     * @todo restore
     */
    // formCampaign: async (root, { input }, { auth }) => {
    //   auth.check();
    //   const { id } = input;
    //   const campaign = await findFormCampaign(id);
    //   return campaign.forms;
    // },

    adCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const campaign = await findAdCampaign(id);
      return campaign.ads;
    },

    /**
     *
     */
    allCampaigns: async (root, { input, pagination, sort }, { auth }) => {
      auth.check();
      const {
        customerIds,
        dateRange: range,
        starting,
        ending,
        mustHaveEmailEnabled,
        mustHaveEmailDeployments,
      } = input;

      const hasStartingDates = starting.before || starting.after;
      const hasEndingDates = ending.before || ending.after;

      if (range && (hasStartingDates || hasEndingDates)) {
        throw new UserInputError('You cannot specify a date range with starting or ending dates');
      }

      if (mustHaveEmailDeployments && !range) {
        throw new UserInputError('A date range must be specified when requiring email deployments.');
      }

      const startDate = {
        ...(starting.before && { $lte: starting.before }),
        ...(starting.after && { $gte: starting.after }),
      };
      const endDate = {
        ...(ending.before && { $lte: ending.before }),
        ...(ending.after && { $gte: ending.after }),
      };

      const criteria = {
        deleted: false,
        ...(customerIds.length && { customerId: { $in: customerIds } }),
        ...(hasKeys(startDate) && { startDate }),
        ...(hasKeys(endDate) && { endDate }),
        ...(range && {
          $or: [
            { startDate: { $lte: range.start }, endDate: { $gte: range.start } },
            { startDate: { $lte: range.end }, endDate: { $gte: range.end } },
            { startDate: { $gte: range.start }, endDate: { $lte: range.end } },
          ],
        }),
        ...((mustHaveEmailDeployments === true || mustHaveEmailEnabled != null) && { 'email.enabled': mustHaveEmailEnabled }),
      };

      if (mustHaveEmailDeployments) {
        const campaignIds = await emailReportService.getCampaignIdsWithDeployments(criteria, {
          starting: range.start,
          ending: range.end,
        });
        criteria._id = { $in: campaignIds };
      }
      return new Pagination(Campaign, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchCampaigns: (root, {
      input,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const { customerIds, starting, ending } = input;

      const startDate = {
        ...(starting.before && { $lte: starting.before }),
        ...(starting.after && { $gte: starting.after }),
      };
      const endDate = {
        ...(ending.before && { $lte: ending.before }),
        ...(ending.after && { $gte: ending.after }),
      };

      const criteria = {
        deleted: false,
        ...(customerIds.length && { customerId: { $in: customerIds } }),
        ...(hasKeys(startDate) && { startDate }),
        ...(hasKeys(endDate) && { endDate }),
      };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(Campaign, pagination);
    },

    /**
     *
     */
    emailCampaignIdentities: async (_, { id, pagination, sort }, { auth }) => {
      auth.check();
      const campaign = await findEmailCampaign(id);

      const { identityEntities } = await emailReportService.getClickEventIdentifiers(campaign, {
        suppressInactives: false,
      });
      const criteria = { entity: { $in: identityEntities } };
      return new Pagination(Identity, { pagination, sort, criteria });
    },

    /**
     * @todo restore
     */
    searchEmailCampaignIdentities: async (_, {
      id,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;

      const campaign = await findEmailCampaign(id);

      const { identityEntities } = await emailReportService.getClickEventIdentifiers(campaign, {
        suppressInactives: false,
      });
      const criteria = { entity: { $in: identityEntities } };
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(Identity, pagination);
    },

    /**
     *
     */
    adCampaignIdentities: async (root, { id, pagination, sort }, { auth }) => {
      auth.check();
      const campaign = await findAdCampaign(id);

      const identityIds = await adReportService.getEligibleIdentityIds(campaign, {
        suppressInactives: false,
      });
      const criteria = { _id: { $in: identityIds } };
      return new Pagination(Identity, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchAdCampaignIdentities: async (root, {
      id,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;

      const campaign = await findAdCampaign(id);

      const identityIds = await adReportService.getEligibleIdentityIds(campaign, {
        suppressInactives: false,
      });
      const criteria = { _id: { $in: identityIds } };

      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(Identity, pagination);
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    adMetricsExcludedGAMLineItemIds: async (_, { input }, { auth }) => {
      auth.check();
      const { id, excludedIds } = input;
      const campaign = await Campaign.findOne({ _id: id, deleted: false });
      if (!campaign) throw new Error(`No campaign record found for ID ${id}.`);
      campaign.set('adMetrics.excludedGAMLineItemIds', excludedIds);
      return campaign.save();
    },

    /**
     *
     */
    adMetricsCampaignStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { id, enabled } = input;
      const campaign = await Campaign.findOne({ _id: id, deleted: false });
      if (!campaign) throw new Error(`No campaign record found for ID ${id}.`);
      campaign.set('adMetrics.enabled', enabled);
      return campaign.save();
    },

    /**
     *
     */
    videoMetricsExcludedBrightcoveVideoIds: async (_, { input }, { auth }) => {
      auth.check();
      const { id, excludedIds } = input;
      const campaign = await Campaign.findOne({ _id: id, deleted: false });
      if (!campaign) throw new Error(`No campaign record found for ID ${id}.`);
      campaign.set('videoMetrics.excludedBrightcoveVideoIds', excludedIds);
      return campaign.save();
    },

    /**
     *
     */
    videoMetricsCampaignStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { id, enabled } = input;
      const campaign = await Campaign.findOne({ _id: id, deleted: false });
      if (!campaign) throw new Error(`No campaign record found for ID ${id}.`);
      campaign.set('videoMetrics.enabled', enabled);
      return campaign.save();
    },

    /**
     *
     */
    createCampaign: (root, { input }, { auth }) => {
      auth.check();
      const {
        customerId,
        salesRepId,
        name,
        startDate,
        endDate,
        maxIdentities,
      } = input;

      const record = new Campaign({
        customerId,
        salesRepId,
        name,
        startDate,
        endDate,
        maxIdentities: calcMax(auth, maxIdentities),
      });
      return record.save();
    },

    /**
     *
     */
    cloneCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;

      const record = await Campaign.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);

      const obj = record.toObject({
        getters: true,
        versionKey: false,
      });
      delete obj._id;
      delete obj.hash;
      delete obj.createdAt;
      delete obj.updatedAt;

      return Campaign.create(obj);
    },

    /**
     *
     */
    updateCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id, payload } = input;
      const {
        customerId,
        name,
        startDate,
        endDate,
        maxIdentities,
      } = payload;

      const record = await Campaign.findOne({ _id: id || null, deleted: false });
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);
      record.set({
        customerId,
        name,
        startDate,
        endDate,
        maxIdentities: calcMax(auth, maxIdentities),
      });
      return record.save();
    },

    /**
     *
     */
    deleteCampaign: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Campaign.findById(id);
      if (!record) throw new Error(`No campaign record found for ID ${id}.`);
      record.deleted = true;
      await record.save();
      return 'ok';
    },

    /**
     *
     */
    emailCampaignTags: async (root, { input }, { auth }) => {
      auth.check();
      const { id, tagIds } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.tagIds', tagIds);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignExcludedTags: async (root, { input }, { auth }) => {
      auth.check();
      const { id, tagIds } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.excludedTagIds', tagIds);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignLinkTypes: async (root, { input }, { auth }) => {
      auth.check();
      const { id, linkTypes } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.allowedLinkTypes', linkTypes);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignExcludedFields: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludeFields } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.excludeFields', handleExcludedFields(excludeFields, auth));
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignIdentityFilters: async (root, { input }, { auth }) => {
      auth.check();
      const { id, filters } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.identityFilters', filters);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignExcludedUrls: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludeUrls } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.excludeUrls', excludeUrls.filter((e) => e.active === false));
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    formCampaignExcludedForms: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludeForms } = input;
      const campaign = await findFormCampaign(id);
      campaign.set('forms.excludeFormIds', excludeForms.filter((e) => e.active === false).map((e) => e.formId));
      await campaign.save();
      return campaign.forms;
    },

    /**
     *
     */
    emailCampaignStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { id, enabled } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.enabled', enabled);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignRestrictSentDate: async (root, { input }, { auth }) => {
      auth.check();
      const { id, restrictToSentDate } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.restrictToSentDate', restrictToSentDate);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignDisplayDeliveredMetrics: async (root, { input }, { auth }) => {
      auth.check();
      const { id, displayDeliveredMetrics } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.displayDeliveredMetrics', displayDeliveredMetrics);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    emailCampaignEnforceMaxEmailDomains: async (_, { input }, { auth }) => {
      auth.check();
      const { id, value } = input;
      const campaign = await findEmailCampaign(id);
      campaign.set('email.enforceMaxEmailDomains', value);
      await campaign.save();
      return campaign.email;
    },

    /**
     *
     */
    formCampaignStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { id, enabled } = input;
      const campaign = await findFormCampaign(id);
      campaign.set('forms.enabled', enabled);
      await campaign.save();
      return campaign.forms;
    },

    /**
     *
     */
    adCampaignStatus: async (root, { input }, { auth }) => {
      auth.check();
      const { id, enabled } = input;
      const campaign = await findAdCampaign(id);
      campaign.set('ads.enabled', enabled);
      await campaign.save();
      return campaign.ads;
    },

    /**
     *
     */
    adCampaignTags: async (root, { input }, { auth }) => {
      auth.check();
      const { id, tagIds } = input;
      const campaign = await findAdCampaign(id);
      campaign.set('ads.tagIds', tagIds);
      await campaign.save();
      return campaign.ads;
    },

    /**
     *
     */
    adCampaignExcludedFields: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludeFields } = input;
      const campaign = await findAdCampaign(id);
      campaign.set('ads.excludeFields', handleExcludedFields(excludeFields, auth));
      await campaign.save();
      return campaign.ads;
    },

    /**
     *
     */
    adCampaignIdentityFilters: async (root, { input }, { auth }) => {
      auth.check();
      const { id, filters } = input;
      const campaign = await findAdCampaign(id);
      campaign.set('ads.identityFilters', filters);
      await campaign.save();
      return campaign.ads;
    },

    /**
     *
     */
    adCampaignExcludedTrackers: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludeTrackerIds } = input;
      const campaign = await findAdCampaign(id);
      campaign.set('ads.excludeTrackerIds', excludeTrackerIds);
      await campaign.save();
      return campaign.ads;
    },

  },
};
