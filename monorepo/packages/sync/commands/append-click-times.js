const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');
const { get } = require('@parameter1/utils');
const cursorBatch = require('../utils/cursor-batch');

/**
 * @typedef AppendClickTimesParams
 * @prop {Record<string, any>} [filter]
 * @prop {string} tenantKey
 *
 * @param {AppendClickTimesParams} params
 */
module.exports = async (params) => {
  /** @type {AppendClickTimesParams} */
  const { filter, tenantKey } = await validateAsync(Joi.object({
    filter: Joi.object().required(),
    tenantKey: Joi.string().trim().required(),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const collection = tenant.db.collection('omeda-email-clicks');

  await cursorBatch({
    collection,
    filter,
    size: 2000,
    handler: async ({ results }) => {
      const sentDateMap = await (async () => {
        const entities = results.reduce((set, doc) => {
          set.add(doc.dep);
          return set;
        }, new Set());
        const deployments = await tenant.db.collection('omeda-email-deployments').find({
          entity: { $in: [...entities] },
        }, { projection: { entity: 1, 'omeda.SentDate': 1 } }).toArray();
        return deployments.reduce((map, deployment) => {
          map.set(deployment.entity, get(deployment, 'omeda.SentDate', null));
          return map;
        }, new Map());
      })();

      const operations = results
        .filter((result) => sentDateMap.get(result.dep))
        .map((result) => {
          const { invalid } = result;
          const sentDate = sentDateMap.get(result.dep);
          const getTimeSince = (date) => {
            if (!date) return null;
            return (date.valueOf() - sentDate.valueOf()) / 1000;
          };
          return {
            updateOne: {
              filter: { _id: result._id },
              update: {
                $set: {
                  time: getTimeSince(result.date),
                  ...(invalid && invalid.length && {
                    invalid: invalid.map((doc) => ({
                      ...doc,
                      time: getTimeSince(doc.date),
                    })),
                  }),
                },
              },
            },
          };
        });

      if (operations.length) {
        await collection.bulkWrite(operations);
      }
    },
    pipeline: [{
      $project: { dep: 1, date: 1, invalid: 1 },
    }],
  });
};
