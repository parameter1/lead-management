const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const { tenantKey, encryptedCustomerIds } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const { db, omeda } = tenant;

  const customers = [...new Set(encryptedCustomerIds)].map((encryptedId) => {
    const entity = omeda.entity.customer({ encryptedCustomerId: encryptedId });
    return { encryptedId, entity, data: {} };
  });

  const emails = [];
  const [legacyInactiveMap, excludedDomainMap] = await Promise.all([
    createInactiveMap({ emails }, tenant),
    createExcludedDomainMap({ emails }, tenant),
  ]);

  const bulkOps = [];
  customers.forEach((customer) => {
    const { updateOne } = transform({ ...customer, legacyInactiveMap, excludedDomainMap }, tenant);
    // create a new update op that only sets on insert.
    const $setOnInsert = {
      ...updateOne.update.$set,
      ...updateOne.update.$setOnInsert, // the original setOnInsert should override the set
      '_sync.scaffoldOnly': true,
    };
    bulkOps.push({
      updateOne: { filter: updateOne.filter, update: { $setOnInsert }, upsert: true },
    });
  });
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
