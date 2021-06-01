const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

const loadCustomer = require('../ops/load-customer');
const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const loadDB = require('../mongodb/load-db');

module.exports = async (params = {}) => {
  const { customerIds } = await validateAsync(Joi.object({
    customerIds: Joi.array().items(Joi.number().min(1).required()).required(),
  }), params);

  const toLoad = [...new Set(customerIds)];
  if (!toLoad.length) return [];
  const customers = await Promise.all(toLoad.map((id) => loadCustomer({ customerId: id })));

  const emails = customers.map((customer) => {
    const { EmailAddress } = customer.emails.getPrimary() || {};
    return EmailAddress;
  });
  const legacyInactiveMap = await createInactiveMap({ emails });

  const db = await loadDB();
  const bulkOps = customers.map((customer) => transform({ ...customer, legacyInactiveMap }));
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
