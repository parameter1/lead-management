const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

const loadDeployments = require('../ops/load-deployments');
const loadDB = require('../mongodb/load-db');

const metrics = [
  'BounceCount',
  'RetryCount',
  'SendingCount',
  'SentCount',
  'TotalClicks',
  'TotalOpens',
  'UniqueClicks',
  'UniqueOpens',
];

module.exports = async (params = {}) => {
  const { trackIds } = await validateAsync(Joi.object({
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }), params);

  const now = new Date();
  const deployments = await loadDeployments({ trackIds });

  const bulkOps = [];
  deployments.forEach(({ entity, data }) => {
    const toSet = metrics.reduce((o, metric) => {
      const key = `omeda.${metric}`;
      return { ...o, [key]: data[metric] || 0 };
    }, {});
    const filter = { entity };
    const update = {
      $setOnInsert: { ...filter, createdAt: now },
      $set: { ...toSet, updatedAt: now },
    };
    bulkOps.push({ updateOne: { filter, update, upsert: true } });
  });
  const db = await loadDB();
  if (bulkOps.length) await db.collection('omeda-email-deployments').bulkWrite(bulkOps);
  return bulkOps;
};
