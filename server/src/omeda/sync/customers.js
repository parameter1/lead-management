const loadCustomer = require('../ops/load-customer');
const transform = require('../ops/transform-customer');
const mongodb = require('../mongodb');

module.exports = async ({ customerIds = [] } = {}) => {
  const ids = Array.isArray(customerIds) ? customerIds : [customerIds];
  const toLoad = [...new Set(ids)].filter((id) => id);
  if (!toLoad.length) return;
  const customers = await Promise.all(toLoad.map((id) => loadCustomer({ customerId: id })));

  const db = await mongodb.db({ name: 'lead-management' });
  const bulkOps = customers.map(transform);
  if (bulkOps.length) await db.collection('identities').bulkWrite(bulkOps);
};
