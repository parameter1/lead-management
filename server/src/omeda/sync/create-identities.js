const customerEntity = require('../utils/customer-entity');
const transform = require('../ops/transform-customer');
const mongodb = require('../mongodb');

/**
 * Creates identities from Omeda click events that do not have an associated customer ID.
 *
 * This happens when a list is directly uploaded to a deployment.
 * Omeda will provide an email address and, optionally, a first and last name.
 */
module.exports = async ({ records = [] } = {}) => {
  if (!Array.isArray(records)) throw new Error('The records parameter must be an array.');
  const writeMap = records.filter(({ EmailAddress }) => EmailAddress).reduce((map, record) => {
    const { EmailAddress, FirstName, LastName } = record;
    const entity = customerEntity({ emailAddress: EmailAddress });
    // format the object to mimic an Omeda customer response.
    map.set(entity, {
      entity,
      data: { FirstName, LastName },
      emails: {
        data: { EmailAddress },
        getPrimary: () => ({ EmailAddress }),
      },
    });
    return map;
  }, new Map());

  const bulkOps = [];
  writeMap.forEach((record) => {
    const transformed = transform(record);
    bulkOps.push(transformed);
  });

  const db = await mongodb.db({ name: 'lead-management' });
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
};
