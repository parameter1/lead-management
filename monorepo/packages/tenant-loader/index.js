const mongodb = require('@lead-management/mongodb/client');
const loadDB = require('@lead-management/mongodb/load-db');
const createOmeda = require('@lead-management/omeda');
const { get } = require('@parameter1/utils');

module.exports = async ({ key } = {}) => {
  if (!key) throw new Error('The tenant key is required.');
  const db = await mongodb.db({ name: 'lead-management' });
  const tenant = await db.collection('tenants').findOne({ zone: key });
  if (!tenant) throw new Error(`No tenant found for key '${key}'`);
  const tenantDb = await loadDB({ tenantKey: key });
  return {
    key,
    doc: tenant,
    db: tenantDb,
    omeda: createOmeda({
      brand: get(tenant, 'omeda.brandKey'),
      appId: get(tenant, 'omeda.appId'),
    }),
  };
};
