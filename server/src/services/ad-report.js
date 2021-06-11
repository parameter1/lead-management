const escapeRegex = require('escape-string-regexp');
const {
  AdCreativeTracker,
  Customer,
  EventAdCreative,
  ExcludedEmailDomain,
  Identity,
} = require('../mongodb/models');

module.exports = {
  async findAllTrackersForCampaign(campaign) {
    const { customerId, ads } = campaign;
    const { tagIds } = ads;

    const customerIds = [customerId];
    const childCustomers = await Customer.find({ parentId: customerId }, { _id: 1 });
    childCustomers.forEach((c) => customerIds.push(c._id));

    const trackerCriteria = {
      customerId: { $in: customerIds },
    };
    if (tagIds && tagIds.length) trackerCriteria.tagIds = { $in: tagIds };

    const trackers = await AdCreativeTracker.find(trackerCriteria, { _id: 1 });
    const trackerIds = trackers.map((t) => t._id);
    if (!trackerIds.length) return [];

    const eventCriteria = { trackerId: { $in: trackerIds } };
    const dateCriteria = createDateCriteria(campaign);
    if (dateCriteria) eventCriteria.day = dateCriteria;

    const eligibleTrackerIds = await EventAdCreative.distinct('trackerId', eventCriteria);
    if (!eligibleTrackerIds.length) return [];

    return AdCreativeTracker.find({ _id: { $in: eligibleTrackerIds } });
  },

  async getEligibleIdentityIds(campaign, {
    suppressInactives = true,
  } = {}) {
    const { ads, maxIdentities } = campaign;
    const excludeTrackerIds = (ads.excludeTrackerIds || []).map((id) => `${id}`);
    const trackers = await this.findAllTrackersForCampaign(campaign);

    // Filter out excluded trackers.
    const trackerIds = trackers
      .map((tracker) => tracker.id)
      .filter((id) => !excludeTrackerIds.includes(`${id}`));

    if (!trackerIds.length) return [];

    const eventCriteria = { action: 'click', trackerId: { $in: trackerIds } };
    const dateCriteria = createDateCriteria(campaign);
    if (dateCriteria) eventCriteria.day = dateCriteria;

    const externalIds = await EventAdCreative.distinct('usr', eventCriteria);

    if (!externalIds.length) return [];

    // Must exclude by ineligible identities, then sort and set max limit.
    const exclusions = await this.buildIdentityExclusionCriteria(campaign, { suppressInactives });
    const criteria = {
      'externalSource.namespace': 'FuelSOAP:Subscriber',
      'externalSource.identifier': { $in: externalIds.map((id) => `${id}`) },
      ...exclusions,
    };

    const identities = await Identity.find(criteria, { _id: 1 })
      .sort({ fieldCount: -1 }).limit(maxIdentities || 0);
    return identities.map((o) => o._id);
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
    const { ads } = campaign;
    const { identityFilters } = ads;

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

    const filters = Array.isArray(identityFilters) ? identityFilters : [];
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

  async identityFieldProjection(campaign) {
    const { ads } = campaign;
    const excludeFields = ads.excludeFields || [];
    return excludeFields.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  },
};
