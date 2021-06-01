const { getAsArray } = require('@parameter1/utils');
const mongodb = require('../mongodb');

module.exports = async ({ emails = [] } = {}) => {
  const emailSet = new Set(emails.filter((v) => v).map((v) => v.toLowerCase().trim()));
  const db = await mongodb.db({ name: 'leads-graph' });
  const docs = await db.collection('identities').find({
    emailAddress: { $in: [...emailSet] },
    $or: [
      { inactive: true },
      { 'inactiveCustomerIds.0': { $exists: true } },
    ],
  }, { projection: { emailAddress: 1, inactive: 1, inactiveCustomerIds: 1 } }).toArray();

  return docs.reduce((map, doc) => {
    const { emailAddress } = doc;
    const inactive = doc.inactive || false;
    const inactiveCustomerIds = getAsArray(doc, 'inactiveCustomerIds');
    if (map.has(emailAddress)) {
      const current = map.get(emailAddress);
      map.set(emailAddress, {
        inactive: current.inactive || doc.inactive,
        inactiveCustomerIds: [...current.inactiveCustomerIds, ...inactiveCustomerIds],
      });
    } else {
      map.set(emailAddress, { inactive, inactiveCustomerIds });
    }
    return map;
  }, new Map());
};
