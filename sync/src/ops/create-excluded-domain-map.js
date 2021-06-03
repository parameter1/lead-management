const loadDB = require('../mongodb/load-db');
const getEmailDomain = require('../utils/get-email-domain');

module.exports = async ({ emails = [] } = {}) => {
  const domainSet = new Set(emails.map(getEmailDomain).filter((v) => v));
  const db = await loadDB();
  const domains = await db.collection('excluded-email-domains').distinct('domain', {
    domain: { $in: [...domainSet] },
  });
  return domains.reduce((map, domain) => {
    map.set(domain, true);
    return map;
  }, new Map());
};
