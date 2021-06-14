const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadDB = require('@lead-management/mongodb/load-db');

const loadCustomers = require('../ops/load-customers');
const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const { encryptedCustomerIds } = await validateAsync(Joi.object({
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
  }), params);

  const customers = await loadCustomers({ encryptedCustomerIds });

  const emails = [];
  customers.forEach((customer) => {
    const { EmailAddress } = customer.emails.getPrimary() || {};
    emails.push(EmailAddress);
  });
  const [legacyInactiveMap, excludedDomainMap] = await Promise.all([
    createInactiveMap({ emails }),
    createExcludedDomainMap({ emails }),
  ]);

  const db = await loadDB();
  const bulkOps = [];
  customers.forEach((customer) => {
    bulkOps.push(transform({ ...customer, legacyInactiveMap, excludedDomainMap }));
  });
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
