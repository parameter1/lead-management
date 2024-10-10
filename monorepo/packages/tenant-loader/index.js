const mongodb = require('@lead-management/mongodb/client');
const loadDB = require('@lead-management/mongodb/load-db');
const createOmeda = require('@lead-management/omeda');
const { get } = require('@parameter1/utils');

/**
 * @typedef LeadsTenant
 * @prop {string} key
 * @prop {import("@parameter1/mongodb").Db} db
 * @prop {LeadsTenantDocument} doc
 * @prop {import("@lead-management/omeda").OmedaApiClient} omeda
 *
 * @typedef LeadsTenantDocument
 * @prop {import("@parameter1/mongodb").ObjectId} _id
 * @prop {string} name
 * @prop {LeadsTenantOmedaDocument} omeda
 * @prop {string} zone
 *
 * @typedef LeadsTenantOmedaDocument
 * @prop {string} appId
 * @prop {string} brandKey
 * @prop {number[]} [disallowedUnrealClickCodes]
 *
 *
 * @param {object} params
 * @param {string} params.key
 * @returns {Promise<LeadsTenant>}
 */
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
