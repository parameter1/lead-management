const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

const loadCustomers = require('../ops/load-customers');
const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const loadDB = require('../mongodb/load-db');

module.exports = async (params = {}) => {
  const { customerIds } = await validateAsync(Joi.object({
    customerIds: Joi.array().items(Joi.number().min(1).required()).required(),
  }), params);

  const customers = await loadCustomers({ customerIds });

  const emails = [];
  customers.forEach((customer) => {
    const { EmailAddress } = customer.emails.getPrimary() || {};
    emails.push(EmailAddress);
  });
  const legacyInactiveMap = await createInactiveMap({ emails });

  const db = await loadDB();
  const bulkOps = [];
  customers.forEach((customer) => {
    bulkOps.push(transform({ ...customer, legacyInactiveMap }));
  });
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
