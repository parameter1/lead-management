const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const Identity = require('../../mongodb/models/identity');

const { isArray } = Array;

module.exports = {
  /**
   *
   */
  IdentityConnection: paginationResolvers.connection,

  /**
   *
   */
  Identity: {
    attributes: async ({ attributes }, _, { loaders }) => {
      if (!attributes) return {};
      const formatted = await Promise.all(Object.keys(attributes).filter((key) => {
        const attr = attributes[key];
        return attr && attr.entity && attr.value != null;
      }).map(async (key) => {
        const { entity, value } = attributes[key];
        const demo = await loaders.omedaDemographicEntity.load(entity);
        if (!demo) return null;
        const demoValues = demo.get('data.DemographicValues');
        if (!demoValues || !demoValues.length) return null;
        const demoValue = demoValues.find((v) => v.Id === value);
        return demoValue ? { key, label: demoValue.Description } : null;
      }));
      return formatted.filter((v) => v).reduce((o, { key, label }) => ({ ...o, [key]: label }), {});
    },
    createdAt: (identity) => identity.get('omeda.SignUpDate'),
    updatedAt: (identity) => identity.get('omeda.ChangedDate'),
    /**
     *
     */
    inactiveCustomers: ((identity, _, { loaders }) => {
      const { inactiveCustomerIds } = identity;
      if (!isArray(inactiveCustomerIds) || !inactiveCustomerIds.length) return [];
      return loaders.customer.loadMany(inactiveCustomerIds);
    }),

    /**
     *
     */
    inactiveCampaigns: ((identity, _, { loaders }) => {
      const { inactiveCampaignIds } = identity;
      if (!isArray(inactiveCampaignIds) || !inactiveCampaignIds.length) return [];
      return loaders.campaign.loadMany(inactiveCampaignIds);
    }),

    /**
     *
     */
    inactiveLineItems: ((identity, _, { loaders }) => {
      const { inactiveLineItemIds } = identity;
      if (!isArray(inactiveLineItemIds) || !inactiveLineItemIds.length) return [];
      return loaders.lineItem.loadMany(inactiveLineItemIds);
    }),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    identity: async (root, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      const record = await Identity.findById(id);
      if (!record) throw new Error(`No identity record found for ID ${id}.`);
      return record;
    },

    /**
     *
     */
    allIdentities: (root, { pagination, sort }, { auth }) => {
      auth.check();
      return new Pagination(Identity, { pagination, sort });
    },

    /**
     *
     */
    searchIdentities: (root, { pagination, search, options }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, {}, options);
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
    identityActivation: async (root, { input }, { auth }) => {
      auth.check();
      const { identityId, active } = input;
      const identity = await Identity.findById(identityId);
      if (!identity) throw new Error(`No identity found for ID '${identityId}'`);
      identity.inactive = !active;
      return identity.save();
    },

    /**
     *
     */
    identityCustomerActivation: async (root, { input }, { auth }) => {
      auth.check();
      const { identityId, active, customerId } = input;
      const identity = await Identity.findById(identityId);
      if (!identity) throw new Error(`No identity found for ID '${identityId}'`);
      if (!active) {
        identity.inactiveCustomerIds.push(customerId);
      } else {
        const inactiveCustomerIds = identity.inactiveCustomerIds.filter((cid) => `${cid}` !== `${customerId}`);
        identity.inactiveCustomerIds = inactiveCustomerIds;
      }
      return identity.save();
    },

    /**
     *
     */
    identityCampaignActivation: async (root, { input }, { auth }) => {
      auth.check();
      const { identityId, active, campaignId } = input;
      const identity = await Identity.findById(identityId);
      if (!identity) throw new Error(`No identity found for ID '${identityId}'`);
      if (!active) {
        identity.inactiveCampaignIds.push(campaignId);
      } else {
        const inactiveCampaignIds = identity.inactiveCampaignIds.filter((cid) => `${cid}` !== `${campaignId}`);
        identity.inactiveCampaignIds = inactiveCampaignIds;
      }
      return identity.save();
    },

    /**
     *
     */
    identityLineItemActivation: async (root, { input }, { auth }) => {
      auth.check();
      const { identityId, active, lineItemId } = input;
      const identity = await Identity.findById(identityId);
      if (!identity) throw new Error(`No identity found for ID '${identityId}'`);

      let inactiveLineItemIds = isArray(identity.inactiveLineItemIds)
        ? identity.inactiveLineItemIds : [];

      if (!active) {
        inactiveLineItemIds.push(lineItemId);
      } else {
        const filtered = inactiveLineItemIds.filter((cid) => `${cid}` !== `${lineItemId}`);
        inactiveLineItemIds = filtered;
      }
      identity.inactiveLineItemIds = inactiveLineItemIds;
      return identity.save();
    },
  },
};
