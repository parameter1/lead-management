const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

const loadCustomers = require('../ops/load-customers');
const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const {
    tenantKey,
    encryptedCustomerIds,
    errorOnNotFound,
    $set,
  } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
    errorOnNotFound: Joi.boolean().default(true),
    $set: Joi.object().default({}),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });

  const customers = await loadCustomers({ encryptedCustomerIds, errorOnNotFound }, tenant);

  const emails = [];
  customers.forEach((customer) => {
    const { EmailAddress } = customer.emails.getPrimary() || {};
    emails.push(EmailAddress);
  });
  const [legacyInactiveMap, excludedDomainMap] = await Promise.all([
    createInactiveMap({ emails }, tenant),
    createExcludedDomainMap({ emails }, tenant),
  ]);

  const { db } = tenant;
  const bulkOps = [];
  customers.forEach((customer) => {
    bulkOps.push(transform({
      ...customer,
      legacyInactiveMap,
      excludedDomainMap,
      additionalSet: $set,
    }, tenant));
  });
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
