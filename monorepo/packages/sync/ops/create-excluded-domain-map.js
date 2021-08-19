const getEmailDomain = require('../utils/get-email-domain');

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
  const domainSet = new Set(emails.map(getEmailDomain).filter((v) => v));
  if (!domainSet.size) return new Map();
  const domains = await db.collection('excluded-email-domains').distinct('domain', {
    domain: { $in: [...domainSet] },
  });
  return domains.reduce((map, domain) => {
    map.set(domain, true);
    return map;
  }, new Map());
};
