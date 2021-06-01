const mongodb = require('./index');
const { TENANT_KEY } = require('../env');

module.exports = async () => {
  if (!TENANT_KEY) throw new Error('The database tenant key is required.');
  const db = await mongodb.db({ name: `lead-management-${TENANT_KEY}` });
  return db;
};
