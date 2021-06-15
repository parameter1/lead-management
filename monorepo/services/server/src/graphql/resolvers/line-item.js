const { Pagination, TypeAhead, paginationResolvers } = require('../pagination');
const dayjs = require('../../dayjs');
const {
  EmailLineItem,
  Identity,
  Order,
} = require('../../mongodb/models');
const LineItem = require('../../mongodb/models/line-item');
// const Form = require('../../models/form');
// const FormEntry = require('../../models/form-entry');
const emailReportService = require('../../services/line-item/email-report');
// const FormRepo = require('../../repos/form');

const findLineItem = async (id) => {
  const record = await LineItem.findOne({ _id: id || null, deleted: false });
  if (!record) throw new Error(`No line item found for ID ${id}.`);
  return record;
};

const findEmailLineItem = async (id) => {
  const record = await EmailLineItem.findOne({ _id: id || null, deleted: false });
  if (!record) throw new Error(`No email line item found for ID ${id}.`);
  return record;
};

// const findFormLineItem = async (id) => {
//   const record = await FormLineItem.findOne({ _id: id || null, deleted: false });
//   if (!record) throw new Error(`No form line item found for ID ${id}.`);
//   return record;
// };

// const findFormLineItemByHash = async (hash) => {
//   const record = await FormLineItem.findOne({ hash: hash || null, deleted: false });
//   if (!record) throw new Error(`No form line item found for hash ${hash}.`);
//   return record;
// };

const calculatePacing = ({
  startDate,
  endDate,
  requiredLeads,
  currentLeads,
}) => {
  const now = new Date();
  // add two days to account for the start and end date being inclusive.
  const totalDays = dayjs(endDate).diff(dayjs(startDate), 'days') + 2;
  const requiredLeadsPerDay = requiredLeads / totalDays;
  const daysElapsed = now >= endDate ? totalDays : dayjs(endDate).diff(dayjs(), 'days') - 1;
  const currentLeadsPerDay = currentLeads ? currentLeads / daysElapsed : 0;
  const leadsShouldBeAt = requiredLeadsPerDay * daysElapsed;
  const pacingRate = (currentLeadsPerDay - requiredLeadsPerDay) / requiredLeadsPerDay;
  return {
    totalDays,
    requiredLeadsPerDay,
    daysElapsed,
    currentLeadsPerDay,
    pacingRate,
    leadsShouldBeAt,
    leadsShouldBeAtPct: leadsShouldBeAt / requiredLeads,
    leadsCurrentlyAt: currentLeads,
    leadsCurrentlyAtPct: currentLeads / requiredLeads,
  };
};

const getEmailProgress = async (lineitem) => {
  const { requiredLeads } = lineitem;
  const startDate = lineitem.get('range.start');
  const endDate = lineitem.get('range.end');

  const {
    urlIds,
    deploymentEntities,
  } = await emailReportService.getEligibleUrlsAndDeployments(lineitem);
  const {
    qualified,
    scrubbed,
    total,
  } = await emailReportService.getQualifiedIdentityCount(lineitem, {
    urlIds,
    deploymentEntities,
  });

  const pacing = calculatePacing({
    startDate,
    endDate,
    requiredLeads,
    currentLeads: qualified,
  });
  const qualRate = qualified >= requiredLeads ? 1 : qualified / requiredLeads;
  return {
    _id: lineitem._id,
    qualified,
    scrubbed,
    total,
    qualRate,
    pacing,
  };
};

/**
 * @todo restore
 */
// const getFormProgress = async (lineItem) => {
//   const form = await Form.findById(lineItem.formId);
//   const startDate = lineItem.get('range.start');
//   const endDate = lineItem.get('range.end');
//   const { requiredLeads: max, choiceFilters } = lineItem;

//   const [qualQuery, scrubQuery] = await Promise.all([
//     FormRepo.buildEntryCriteriaFor(form, {
//       suppressInactives: true,
//       refreshEntries: true,
//       max,
//       startDate,
//       endDate,
//       choiceFilters,
//     }),
//     FormRepo.buildEntryCriteriaFor(form, {
//       onlyInactive: true,
//       refreshEntries: false,
//       max,
//       startDate,
//       endDate,
//       choiceFilters,
//     }),
//   ]);

//   const [qualified, scrubbed] = await Promise.all([
//     FormEntry.countDocuments(qualQuery),
//     FormEntry.countDocuments(scrubQuery),
//   ]);

//   const pacing = calculatePacing({
//     startDate,
//     endDate,
//     requiredLeads: max,
//     currentLeads: qualified,
//   });

//   const qualRate = qualified >= max ? 1 : qualified / max;
//   const total = qualified + scrubbed;

//   return {
//     _id: lineItem._id,
//     qualified,
//     scrubbed,
//     total,
//     qualRate,
//     pacing,
//   };
// };

/**
 * @todo fix form progress
 */
const getLineItemProgress = async (lineitem) => {
  if (lineitem.type === 'email') return getEmailProgress(lineitem);
  throw new Error('Form line items are not yet implemented');
  // return getFormProgress(lineitem);
};

const lineitemTypesEnum = new Map([
  ['FORM', 'form-lineitem'],
  ['EMAIL', 'email'],
]);

const buildLineItemCriteria = async ({ input }) => {
  const {
    dashboardStatus: status,
    customerIds,
    salesRepIds,
    types,
    starting,
    ending,
  } = input;
  const now = new Date();
  const criteria = status === 'archived' ? { deleted: false, archived: true } : { deleted: false, archived: { $ne: true } };
  if (status === 'active') {
    criteria['range.start'] = { $lte: now };
  }

  const $and = [];
  if (starting.before) $and.push({ 'range.start': { $lte: starting.before } });
  if (starting.after) $and.push({ 'range.start': { $gte: starting.after } });
  if (ending.before) $and.push({ 'range.end': { $lte: ending.before } });
  if (ending.after) $and.push({ 'range.end': { $gte: ending.after } });

  if (customerIds.length || salesRepIds.length) {
    // find orders that match the filters
    const orderIds = await Order.distinct('_id', {
      ...(customerIds.length && { customerId: { $in: customerIds } }),
      ...(salesRepIds.length && { salesRepId: { $in: salesRepIds } }),
    });
    criteria.orderId = { $in: orderIds };
  }
  if (types.length) criteria.type = { $in: types.map((t) => lineitemTypesEnum.get(t)) };
  if ($and.length) criteria.$and = $and;

  // Find all non-deleted, non-archived campaigns.
  // Then determine their qualification rate and filter based on requested data.
  // @todo find a more efficient way of handling this condition.
  const lineitems = await LineItem.find(criteria);
  const progresses = await Promise.all(lineitems.map(getLineItemProgress));

  const ids = progresses.filter((progress) => {
    if (status === 'active') return progress.qualRate < 1;
    return progress.qualRate === 1;
  }).map((progress) => progress._id);

  return { _id: { $in: ids } };
};

const commonResolvers = {
  order: (lineItem, _, { loaders }) => loaders.order.load(lineItem.orderId),
  status: ({ range }) => {
    const { start, end } = range;
    const now = Date.now();
    if (end.valueOf() < now) return 'Completed';
    if (start.valueOf() > now) return 'Pending';
    return 'Active';
  },
  type: ({ type }) => {
    if (type === 'form-lineitem') return 'form';
    return type;
  },
  typeFormatted: ({ type }) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'form-lineitem':
        return 'MQL/Form';
      default:
        return '';
    }
  },
  cpl: ({ totalValue, requiredLeads }) => {
    if (!requiredLeads) return 0;
    return (totalValue || 0) / requiredLeads;
  },
};

module.exports = {
  /**
   *
   */
  LineItemConnection: paginationResolvers.connection,
  EmailLineItemIdentityConnection: paginationResolvers.connection,
  FormLineItemLeadConnection: paginationResolvers.connection,

  /**
   *
   */
  LineItem: {
    /**
     *
     */
    __resolveType({ type }) {
      if (type === 'form-lineitem') return 'FormLineItem';
      const prefix = type.charAt(0).toUpperCase() + type.slice(1);
      return `${prefix}LineItem`;
    },
  },

  FormLineItem: {
    ...commonResolvers,

    form: (lineItem, _, { loaders }) => loaders.form.load(lineItem.formId),

    progress: async (lineItem) => {
      const {
        qualified,
        scrubbed,
        total,
        qualRate,
        pacing,
      } = await getFormProgress(lineItem);

      return {
        qualified: { total: qualified, rate: qualRate },
        scrubbed: { total: scrubbed, rate: total ? scrubbed / total : 0 },
        pacing,
      };
    },
  },

  EmailLineItem: {
    ...commonResolvers,

    tags: (lineItem, _, { loaders }) => loaders.tag.loadMany(lineItem.tagIds),
    excludedTags: (lineItem, _, { loaders }) => loaders.tag.loadMany(lineItem.excludedTagIds),
    progress: async (lineitem) => {
      const {
        qualified,
        scrubbed,
        total,
        qualRate,
        pacing,
      } = await getEmailProgress(lineitem);

      return {
        qualified: { total: qualified, rate: qualRate },
        scrubbed: { total: scrubbed, rate: total ? scrubbed / total : 0 },
        pacing,
      };
    },

    urlGroups: async (lineitem) => {
      const excludedUrls = lineitem.excludedUrls || [];
      const emailSends = await emailReportService.findAllUrlSendsForLineItem(lineitem);
      const map = emailSends.reduce((obj, emailSend) => {
        const { urlId } = emailSend;
        // eslint-disable-next-line no-param-reassign
        if (!obj[urlId]) obj[urlId] = [];
        obj[urlId].push(emailSend);
        return obj;
      }, {});
      return Object.keys(map).reduce((arr, urlId) => {
        arr.push({ urlId, sendUrls: map[urlId], excludedUrls });
        return arr;
      }, []);
    },

    excludedUrls: (lineitem) => {
      if (!Array.isArray(lineitem.excludedUrls)) return [];
      return lineitem.excludedUrls;
    },
  },

  /**
   *
   */
  EmailLineItemExcludedUrl: {
    url: (excluded, _, { loaders }) => loaders.extractedUrl.load(excluded.urlId),
    deployment: (excluded, _, { loaders }) => loaders
      .emailDeploymentEntity.load(excluded.deploymentEntity),
  },

  EmailLineItemUrlGroup: {
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

  EmailLineItemUrlDeploymentGroup: {
    deployment: ({ entity }, _, { loaders }) => loaders.emailDeploymentEntity.load(entity),
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    lineItem: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return findLineItem(id);
    },

    /**
     *
     */
    emailLineItem: async (_, { input }, { auth }) => {
      auth.check();
      const { id } = input;
      return findEmailLineItem(id);
    },

    /**
     * @todo restore
     */
    // formLineItem: async (_, { input }, { auth }) => {
    //   auth.check();
    //   const { id } = input;
    //   return findFormLineItem(id);
    // },

    /**
     * @todo restore
     */
    // formLineItemLeads: async (_, { input, pagination, sort }, ctx) => {
    //   const {
    //     id,
    //     hash,
    //     active,
    //     refresh,
    //   } = input;
    //   const { after } = pagination;

    //   if (id && hash) throw new Error('You cannot use both a form ID and hash.');
    //   if (!id && !hash) throw new Error('You must specify either a form ID or hash.');

    //   const lineItem = id ? await findFormLineItem(id) : await findFormLineItemByHash(hash);
    //   const form = await Form.findById(lineItem.formId);
    //   ctx.form = form;

    //   const criteria = await FormRepo.buildEntryCriteriaFor(form, {
    //     suppressInactives: active,
    //     onlyInactive: !active,
    //     refreshEntries: refresh && !after,
    //     max: lineItem.requiredLeads,
    //     startDate: lineItem.get('range.start'),
    //     endDate: lineItem.get('range.end'),
    //     choiceFilters: lineItem.choiceFilters,
    //   });
    //   return new Pagination(FormEntry, { pagination, sort, criteria });
    // },

    /**
     *
     */
    lineItemByHash: async (_, { input }) => {
      const { hash } = input;
      const lineitem = await LineItem.findOne({ hash, deleted: false });
      if (!lineitem) throw new Error(`No line item found for hash '${hash}'`);
      return lineitem;
    },

    /**
     *
     */
    allLineItemsForOrder: (_, { input, pagination, sort }, { auth }) => {
      auth.check();
      const { orderId } = input;
      const criteria = { orderId, deleted: false };
      return new Pagination(LineItem, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchLineItemsForOrder: (_, {
      input,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { orderId } = input;
      const { field, phrase } = search;
      const instance = new TypeAhead(field, phrase, { orderId, deleted: false }, options);
      return instance.paginate(LineItem, pagination);
    },

    /**
     *
     */
    allLineItems: async (_, { input, pagination, sort }, { auth }) => {
      auth.check();
      const criteria = await buildLineItemCriteria({ input });
      return new Pagination(LineItem, { pagination, sort, criteria });
    },

    /**
     *
     */
    searchLineItems: async (_, {
      input,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { field, phrase } = search;
      const criteria = await buildLineItemCriteria({ input });
      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(LineItem, pagination);
    },

    emailLineItemActiveIdentities: async (_, { input, pagination, sort }, { auth }) => {
      auth.check();
      const { id } = input;
      const lineitem = await findEmailLineItem(id);
      const {
        urlIds,
        deploymentEntities,
      } = await emailReportService.getEligibleUrlsAndDeployments(lineitem);

      const entities = await emailReportService.getActiveIdentityEntities(lineitem, {
        urlIds,
        deploymentEntities,
      });
      const criteria = { entity: { $in: entities } };
      return new Pagination(Identity, { pagination, sort, criteria });
    },

    searchEmailLineItemActiveIdentities: async (_, {
      input,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { id } = input;
      const { field, phrase } = search;

      const lineitem = await findEmailLineItem(id);
      const {
        urlIds,
        deploymentEntities,
      } = await emailReportService.getEligibleUrlsAndDeployments(lineitem);

      const entities = await emailReportService.getActiveIdentityEntities(lineitem, {
        urlIds,
        deploymentEntities,
      });
      const criteria = { entity: { $in: entities } };

      const instance = new TypeAhead(field, phrase, criteria, options);
      return instance.paginate(Identity, pagination);
    },

    emailLineItemInactiveIdentities: async (_, { input, pagination, sort }, { auth }) => {
      auth.check();
      const { id } = input;
      const lineitem = await findEmailLineItem(id);
      const {
        urlIds,
        deploymentEntities,
      } = await emailReportService.getEligibleUrlsAndDeployments(lineitem);

      const entities = await emailReportService.getInactiveIdentityEntities(lineitem, {
        urlIds,
        deploymentEntities,
      });
      const criteria = { entity: { $in: entities } };
      return new Pagination(Identity, { pagination, sort, criteria });
    },

    searchEmailLineItemInactiveIdentities: async (_, {
      input,
      pagination,
      search,
      options,
    }, { auth }) => {
      auth.check();
      const { id } = input;
      const { field, phrase } = search;

      const lineitem = await findEmailLineItem(id);
      const {
        urlIds,
        deploymentEntities,
      } = await emailReportService.getEligibleUrlsAndDeployments(lineitem);

      const entities = await emailReportService.getInactiveIdentityEntities(lineitem, {
        urlIds,
        deploymentEntities,
      });
      const criteria = { entity: { $in: entities } };

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
    createEmailLineItem: (root, { input }, { auth }) => {
      auth.check();
      const {
        name,
        orderId,
        requiredLeads,
        totalValue,
        range,
        excludedFields,
        requiredFields,
        linkTypes,
        tagIds,
        identityFilters,
        notes,
      } = input;

      const record = new EmailLineItem({
        name,
        orderId,
        requiredLeads,
        totalValue,
        range,
        excludedFields,
        requiredFields,
        linkTypes,
        tagIds,
        identityFilters,
        notes,
      });
      return record.save();
    },

    /**
     * @todo restore
     */
    // createFormLineItem: (root, { input }, { auth }) => {
    //   auth.check();
    //   const {
    //     name,
    //     orderId,
    //     requiredLeads,
    //     totalValue,
    //     range,
    //     notes,
    //     formId,
    //   } = input;

    //   const record = new FormLineItem({
    //     name,
    //     orderId,
    //     requiredLeads,
    //     totalValue,
    //     range,
    //     notes,
    //     formId,
    //   });
    //   return record.save();
    // },

    lineItemName: async (_, { input }, { auth }) => {
      auth.check();
      const { id, name } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('name', name);
      return lineItem.save();
    },

    lineItemNotes: async (_, { input }, { auth }) => {
      auth.check();
      const { id, notes } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('notes', notes);
      return lineItem.save();
    },

    lineItemRequiredLeads: async (_, { input }, { auth }) => {
      auth.check();
      const { id, requiredLeads } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('requiredLeads', requiredLeads);
      return lineItem.save();
    },

    lineItemTotalValue: async (_, { input }, { auth }) => {
      auth.check();
      const { id, totalValue } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('totalValue', totalValue);
      return lineItem.save();
    },

    lineItemDateRange: async (_, { input }, { auth }) => {
      auth.check();
      const { id, range } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('range', range);
      return lineItem.save();
    },

    lineItemArchived: async (root, { input }, { auth }) => {
      auth.check();
      const { id, archived } = input;
      const lineItem = await findLineItem(id);
      lineItem.set('archived', archived);
      return lineItem.save();
    },

    emailLineItemTags: async (_, { input }, { auth }) => {
      auth.check();
      const { id, tagIds } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('tagIds', tagIds);
      return lineItem.save();
    },

    emailLineItemExcludedTags: async (_, { input }, { auth }) => {
      auth.check();
      const { id, tagIds } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('excludedTagIds', tagIds);
      return lineItem.save();
    },

    emailLineItemLinkTypes: async (_, { input }, { auth }) => {
      auth.check();
      const { id, linkTypes } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('linkTypes', linkTypes);
      return lineItem.save();
    },

    emailLineItemExcludedFields: async (_, { input }, { auth }) => {
      auth.check();
      const { id, excludedFields } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('excludedFields', excludedFields);
      return lineItem.save();
    },

    emailLineItemRequiredFields: async (_, { input }, { auth }) => {
      auth.check();
      const { id, requiredFields } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('requiredFields', requiredFields);
      return lineItem.save();
    },

    emailLineItemIdentityFilters: async (_, { input }, { auth }) => {
      auth.check();
      const { id, filters } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('identityFilters', filters);
      return lineItem.save();
    },

    /**
     *
     */
    emailLineItemExcludedUrls: async (root, { input }, { auth }) => {
      auth.check();
      const { id, excludedUrls } = input;
      const lineItem = await findEmailLineItem(id);
      lineItem.set('excludedUrls', excludedUrls.filter((e) => e.active === false));
      return lineItem.save();
    },

    /**
     * @todo restore
     */
    // formLineItemChoiceFilters: async (_, { input }, { auth }) => {
    //   auth.check();
    //   const { id, filters } = input;
    //   const lineItem = await findFormLineItem(id);
    //   lineItem.set('choiceFilters', filters);
    //   return lineItem.save();
    // },
  },
};
