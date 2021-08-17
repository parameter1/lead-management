const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadDB = require('@lead-management/mongodb/load-db');
const customerEntity = require('@lead-management/omeda/entity-id/customer');

const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const { encryptedCustomerIds } = await validateAsync(Joi.object({
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
  }), params);

  const customers = [...new Set(encryptedCustomerIds)].map((encryptedId) => {
    const entity = customerEntity({ encryptedCustomerId: encryptedId });
    return { encryptedId, entity, data: {} };
  });

  const emails = [];
  const [legacyInactiveMap, excludedDomainMap] = await Promise.all([
    createInactiveMap({ emails }),
    createExcludedDomainMap({ emails }),
  ]);

  const db = await loadDB();
  const bulkOps = [];
  customers.forEach((customer) => {
    const { updateOne } = transform({ ...customer, legacyInactiveMap, excludedDomainMap });
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
