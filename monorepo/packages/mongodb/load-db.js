const mongodb = require('./client');

module.exports = async ({ tenantKey } = {}) => {
  if (!tenantKey) throw new Error('The database tenant key is required.');
  const db = await mongodb.db({ name: `lead-management-${tenantKey}` });
  return db;
};
