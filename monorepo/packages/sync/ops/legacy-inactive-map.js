const { getAsArray } = require('@parameter1/utils');
const loadDB = require('@lead-management/mongodb/load-db');

module.exports = async ({ emails = [] } = {}) => {
  const emailSet = new Set(emails.filter((v) => v).map((v) => v.toLowerCase().trim()));
  if (!emailSet.size) return new Map();
  const db = await loadDB();
  const docs = await db.collection('legacy-inactive-identities').find({
    emailAddress: { $in: [...emailSet] },
  }).toArray();

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
