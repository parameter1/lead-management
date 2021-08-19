const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

const loadDeployments = require('../ops/load-deployments');

const metrics = [
  'BounceCount',
  'RecipientCount',
  'RetryCount',
  'SendingCount',
  'SentCount',
  'TotalClicks',
  'TotalOpens',
  'TotalUnsubscribe',
  'UniqueClicks',
  'UniqueOpens',
];

module.exports = async (params = {}) => {
  const { tenantKey, trackIds } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });

  const now = new Date();
  const deployments = await loadDeployments({ trackIds }, tenant);

  const bulkOps = [];
  deployments.forEach(({ entity, data }) => {
    const toSet = metrics.reduce((o, metric) => {
      const key = `omeda.${metric}`;
      return { ...o, [key]: data[metric] || 0 };
    }, {});
    const filter = { entity };
    const update = {
      $setOnInsert: { ...filter, createdAt: now },
      $set: { ...toSet, updatedAt: now, lastRetrievedAt: now },
    };
    bulkOps.push({ updateOne: { filter, update, upsert: true } });
  });
  const { db } = tenant;
  if (bulkOps.length) await db.collection('omeda-email-deployments').bulkWrite(bulkOps);
  return bulkOps;
};
