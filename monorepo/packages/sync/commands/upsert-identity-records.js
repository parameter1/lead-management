const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadDB = require('@lead-management/mongodb/load-db');
const customerEntity = require('@lead-management/omeda/entity-id/customer');

const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const createExcludedDomainMap = require('../ops/create-excluded-domain-map');

module.exports = async (params = {}) => {
  const { records } = await validateAsync(Joi.object({
    records: Joi.array().items(Joi.object({
      EmailAddress: Joi.string().lowercase().trim().required(),
      FirstName: Joi.string().trim().allow(null),
      LastName: Joi.string().trim().allow(null),
    })).required(),
  }), params);

  const emails = [];
  const writeMap = new Map();
  records.forEach((record) => {
    const { EmailAddress, FirstName, LastName } = record;
    const entity = customerEntity({ emailAddress: EmailAddress });
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
    createInactiveMap({ emails }),
    createExcludedDomainMap({ emails }),
  ]);
  const bulkOps = [];
  writeMap.forEach((record) => {
    const transformed = transform({ ...record, legacyInactiveMap, excludedDomainMap });
    bulkOps.push(transformed);
  });
  const db = await loadDB();
  await db.collection('identities').bulkWrite(bulkOps);
  return bulkOps;
};
