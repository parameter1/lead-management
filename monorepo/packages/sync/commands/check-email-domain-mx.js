const Joi = require('@parameter1/joi');
const loadTenant = require('@lead-management/tenant-loader');
const { resolveMx } = require('dns').promises;
const cursorBatch = require('../utils/cursor-batch');

module.exports = async (params) => {
  /** @type {AppendClickTimesParams} */
  const { tenantKey } = await Joi.attempt(params, Joi.object({
    tenantKey: Joi.string().trim().required(),
  }).required());

  const { db } = await loadTenant({ key: tenantKey });

  const collection = db.collection('identities');

  await cursorBatch({
    collection,
    filter: {
      emailDomain: { $exists: true, $ne: null },
    },
    handler: async ({ results }) => {
      const domains = results
        .reduce((set, doc) => set.add(doc.emailDomain.toLowerCase()), new Set());
      const resolved = await Promise.all([...domains].map(async (domain) => {
        const now = new Date();
        try {
          const mx = await resolveMx(domain);
          const sorted = mx.sort((a, b) => {
            if (a.priority > b.priority) return 1;
            if (a.priority < b.priority) return -1;
            return 0;
          });
          return {
            domain,
            mx: mx
              .map((v) => ({ ...v, exchange: v.exchange.toLowerCase() })),
            primary: sorted.length ? sorted[0].exchange.toLowerCase() : null,
          };
        } catch (e) {
          if (['ENODATA', 'ENOTFOUND', 'ESERVFAIL'].includes(e.code)) return { domain, r: null, now };
          throw e;
        }
      }));
      const operations = resolved.map(({
        domain,
        mx,
        now,
        primary,
      }) => ({
        updateOne: {
          filter: { _id: domain },
          update: {
            $inc: { timesChecked: 1 },
            $setOnInsert: { _id: domain },
            $set: {
              lastRetrieved: now,
              mx,
              primary,
              domains: {
                root: primary ? primary.split('.').reverse().slice(0, 2).reverse()
                  .join('.') : null,
                sub1: primary ? primary.split('.').reverse().slice(0, 3).reverse()
                  .join('.') : null,
              },
            },
          },
          upsert: true,
        },
      }));
      await db.collection('email-domain-mx-records').bulkWrite(operations);
    },
    size: 500,
  });
};
