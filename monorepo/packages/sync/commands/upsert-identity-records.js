const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const { tenantKey, records } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
    records: Joi.array().items(Joi.object({
      EmailAddress: Joi.string().lowercase().trim().required(),
      FirstName: Joi.string().trim().allow(null),
      LastName: Joi.string().trim().allow(null),
    })).required(),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const { db, omeda } = tenant;

  const emails = [];
  const writeMap = new Map();
  records.forEach((record) => {
    const { EmailAddress, FirstName, LastName } = record;
    const entity = omeda.entity.customer({ emailAddress: EmailAddress });
    writeMap.set(entity, {
      entity,
      data: { FirstName, LastName },
      emails: {
        data: { EmailAddress },
        getPrimary: () => ({ EmailAddress }),
      },
    });
    emails.push(EmailAddress);
  });

  const [legacyInactiveMap, excludedDomainMap] = await Promise.all([
    createInactiveMap({ emails }, tenant),
    createExcludedDomainMap({ emails }, tenant),
  ]);
  const bulkOps = [];
  writeMap.forEach((record) => {
    const transformed = transform({ ...record, legacyInactiveMap, excludedDomainMap }, tenant);
    bulkOps.push(transformed);
  });
  await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
