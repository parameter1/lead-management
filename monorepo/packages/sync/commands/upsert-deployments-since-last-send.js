const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');
const upsert = require('./upsert-deployments');
const loadIds = require('../ops/load-deployment-ids-since');
const dayjs = require('../dayjs');

module.exports = async (params = {}) => {
  const { tenantKey } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const { db } = tenant;
  // find all deployments in the leads database over the last 7 days...
  // get the last omeda deployment saved in the db
  const lastDeployment = await db.collection('omeda-email-deployments').findOne({
    'omeda.Status': { $in: ['Sent', 'Sending'] },
    'omeda.SentDate': { $ne: null, $exists: true },
  }, { projection: { 'omeda.SentDate': 1 }, sort: { 'omeda.SentDate': -1 } });
  const defaultStart = dayjs().subtract(30, 'days').toDate();
  const start = lastDeployment ? lastDeployment.omeda.SentDate : defaultStart;
  const trackIds = await loadIds({ onOrAfter: start }, tenant);
  if (trackIds.length) await upsert({ tenantKey, trackIds });
  return trackIds;
};
