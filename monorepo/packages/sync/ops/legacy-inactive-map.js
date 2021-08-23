const { getAsArray } = require('@parameter1/utils');

/**
 *
 * @param {object} params
 * @param {string[]} params.emails
 * @param {object} tenant
 * @param {object} tenant.doc
 * @param {object} tenant.db
 * @param {object} tenant.omeda
 * @returns {Map}
 */
module.exports = async ({ emails = [] } = {}, { db } = {}) => {
  const emailSet = new Set(emails.filter((v) => v).map((v) => v.toLowerCase().trim()));
  if (!emailSet.size) return new Map();
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
