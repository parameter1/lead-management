const mongodb = require('./client');

/**
 * @param {object} params
 * @param {string} params.tenantKey
 * @returns {Promise<import("@parameter1/mongodb").Db>}
 */
module.exports = async ({ tenantKey } = {}) => {
  if (!tenantKey) throw new Error('The database tenant key is required.');
  const db = await mongodb.db({ name: `lead-management-${tenantKey}` });
  return db;
};
