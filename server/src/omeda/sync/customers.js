const loadCustomer = require('../ops/load-customer');
const transform = require('../ops/transform-customer');
const createInactiveMap = require('../ops/legacy-inactive-map');
const mongodb = require('../mongodb');

module.exports = async ({ customerIds = [] } = {}) => {
  const ids = Array.isArray(customerIds) ? customerIds : [customerIds];
  const toLoad = [...new Set(ids)].filter((id) => id);
  if (!toLoad.length) return;
  const customers = await Promise.all(toLoad.map((id) => loadCustomer({ customerId: id })));

  const emails = customers.map((customer) => {
    const { EmailAddress } = customer.emails.getPrimary() || {};
    return EmailAddress;
  });
  const legacyInactiveMap = await createInactiveMap({ emails });

  const db = await mongodb.db({ name: 'lead-management' });
  const bulkOps = customers.map((customer) => transform({ ...customer, legacyInactiveMap }));
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
};
