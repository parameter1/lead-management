const Joi = require('@parameter1/joi');
const { ObjectId } = require('@lead-management/mongodb');
const { getAsArray } = require('@parameter1/utils');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');
const { createHash } = require('crypto');

const loadDeploymentClicks = require('../ops/load-deployment-clicks');
const extractUrlId = require('../utils/extract-url-id');

/**
 * @typedef {string} OmedaClickKey
 *
 * @typedef OmailClick
 * @prop {string} [EncryptedCustomerId]
 * @prop {Date} ClickDate
 * @prop {string} [EmailAddress]
 * @prop {string} [FirstName]
 * @prop {string} [LastName]
 * @prop {number} NumberOfClicks
 *
 * @typedef OmailUnrealClick
 * @prop {string} [EncryptedCustomerId]
 * @prop {string} [EmailAddress]
 * @prop {string} [FirstName]
 * @prop {string} [LastName]
 * @prop {OmailUnrealClickDetail[]} UnrealClicks
 *
 * @todo MAKE SURE THIS RETURNS FROM OUR API CLIENT PROPERLY
 * @typedef OmailUnrealClickDetail
 * @prop {number} NumberOfUnrealClicks
 * @prop {Date} ClickDate
 * @prop {OmailUnrealClickReason} Reason
 *
 * @typedef {(1|2|3|4|5|6|7|8|9|10)} OmailUnrealClickReason
 *
 * @typedef MappedClick
 * @prop {UpsertClickFilter} filter
 * @prop {Date} date
 * @prop {number} n
 * @prop {Map<OmailUnrealClickReason, InvalidMappedClick>} [invalid]
 * @prop {number} [time]
 *
 * @typedef InvalidMappedClick
 * @prop {Date} date
 * @prop {number} n
 * @prop {number} [time]
 *
 * @typedef UpsertClickFilter
 * @prop {import("mongodb").ObjectId} url
 * @prop {string} idt
 * @prop {string} dep
 * @prop {string} split
 */

/**
 * @param {object} params
 * @param {Date} params.asOf
 * @param {string} params.hash
 * @param {MappedClick} params.mapped
 */
const createUpsertOpFrom = ({ asOf, hash, mapped }) => {
  const { filter, invalid } = mapped;

  return {
    updateOne: {
      filter,
      update: {
        $setOnInsert: filter,
        $set: {
          asOf,
          date: mapped.date,
          hash,
          invalid: invalid ? [...invalid].map(([code, click]) => ({ code, ...click })) : [],
          n: mapped.n,
          time: mapped.time || null,
        },
      },
      upsert: true,
    },
  };
};

/**
 * Upserts deployment click event data for the provided deployment IDs.
 * Also returns the encrypted customer IDs and customer records associated with the click events
 * that can be used for customer upserting.
 *
 * @param {object} params
 * @param {string[]} params.trackIds
 */
module.exports = async (params = {}) => {
  const { tenantKey, trackIds, unrealDeploymentDate } = await validateAsync(Joi.object({
    tenantKey: Joi.string().trim().required(),
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
    unrealDeploymentDate: Joi.date().default(new Date('2023-06-07T00:00:00-05:00')),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const { db, omeda } = tenant;

  const asOf = new Date();

  const [items, deploymentSentDateMap] = await Promise.all([
    loadDeploymentClicks({ trackIds }, tenant),
    (async () => {
      const map = new Map();
      const entities = trackIds.map((trackId) => omeda.entity.deployment({ trackId }));
      const fromDatabase = await db.collection('omeda-email-deployments').aggregate([
        { $match: { entity: { $in: entities } } },
        { $project: { _id: 0, TrackId: '$omeda.TrackId', SentDate: '$omeda.SentDate' } },
      ]).toArray();
      fromDatabase.forEach((doc) => map.set(doc.TrackId, doc.SentDate));

      const missingIds = trackIds.filter((trackId) => !map.has(trackId));
      if (missingIds.length) {
        await Promise.all(trackIds.map(async (trackId) => {
          const { data } = await omeda.resource('email').lookupDeploymentById({ trackId });
          map.set(data.TrackId, data.SentDate);
        }));
      }
      return map;
    })(),
  ]);

  /**
   *
   * @param {OmailClick|OmailUnrealClick} click
   * @returns {string}
   */
  const getIdentityFrom = (click) => {
    const {
      EncryptedCustomerId: encryptedCustomerId,
      EmailAddress: emailAddress,
    } = click;

    return encryptedCustomerId
      ? omeda.entity.customer({ encryptedCustomerId })
      : omeda.entity.customer({ emailAddress });
  };

  const eventOps = [];
  const encryptedCustomerIds = new Set();
  const identityRecords = new Map();

  /** @type {Map<string, Set<string>>} */
  const deploymentClickHashMap = new Map();

  items.forEach(({ data, entity }) => {
    /** @type {Date|undefined} */
    const sentDate = deploymentSentDateMap.get(data.TrackId);

    deploymentClickHashMap.set(entity, new Set());

    /**
     * @param {Date} [date]
     * @returns {number}
     */
    const getTimeSince = (date) => {
      if (!date) return null;
      return (date.valueOf() - sentDate.valueOf()) / 1000;
    };

    getAsArray(data, 'splits').forEach((split) => {
      getAsArray(split, 'links').forEach((link) => {
        const urlId = extractUrlId(link.LinkURL);
        if (!urlId) return;

        /** @type {Map<OmedaClickKey, MappedClick>} */
        const clickMap = new Map();

        /**
         *
         * @param {OmailClick|OmailUnrealClick} click
         * @returns {UpsertClickFilter}
         */
        const getUpsertFilter = (click) => ({
          url: new ObjectId(urlId),
          idt: getIdentityFrom(click),
          dep: entity,
          split: split.Split,
        });

        /**
         *
         * @param {OmailClick|OmailUnrealClick} click
         * @returns {OmedaClickKey}
         */
        const getClickKey = (click) => {
          const filter = getUpsertFilter(click);
          return Object.keys(filter).reduce((arr, key) => {
            arr.push(`${filter[key]}`);
            return arr;
          }, []).join('__');
        };

        /**
         *
         * @param {OmailClick|OmailUnrealClick} click
         */
        const addCustomer = (click) => {
          const {
            EncryptedCustomerId: encryptedCustomerId,
            EmailAddress: emailAddress,
            FirstName,
            LastName,
          } = click;
          const idt = getIdentityFrom(click);

          if (encryptedCustomerId) {
            encryptedCustomerIds.add(encryptedCustomerId);
          } else {
            identityRecords.set(idt, { EmailAddress: emailAddress, FirstName, LastName });
          }
        };

        /** @type {OmailClick[]} */
        const clicks = getAsArray(link, 'clicks');
        clicks.forEach((click) => {
          addCustomer(click);

          const key = getClickKey(click);
          /** @type {MappedClick} */
          const mapped = clickMap.get(key) || {};
          mapped.filter = getUpsertFilter(click);
          mapped.date = click.ClickDate;
          mapped.n = click.NumberOfClicks;
          if (sentDate) mapped.time = getTimeSince(click.ClickDate);
          clickMap.set(key, mapped);
        });

        if (data.SentDate >= unrealDeploymentDate) {
          /** @type {OmailUnrealClick[]} */
          const unrealClicks = getAsArray(link, 'unrealClicks');
          unrealClicks.forEach((click) => {
            addCustomer(click);

            const key = getClickKey(click);
            /** @type {MappedClick} */
            const mapped = clickMap.get(key) || {};
            mapped.filter = getUpsertFilter(click);
            if (!mapped.n) mapped.n = 0;
            if (!mapped.date) {
              const [mostRecent] = click.UnrealClicks.sort((a, b) => b.ClickDate - a.ClickDate);
              mapped.date = mostRecent.ClickDate;
              mapped.time = getTimeSince(mostRecent.ClickDate);
            }
            const invalid = mapped.invalid || new Map();
            click.UnrealClicks.forEach((detail) => {
              const { Reason: code } = detail;
              invalid.set(code, {
                date: detail.ClickDate,
                n: detail.NumberOfUnrealClicks,
                ...(sentDate && { time: getTimeSince(detail.ClickDate) }),
              });
            });
            mapped.invalid = invalid;
            clickMap.set(key, mapped);
          });
        }

        clickMap.forEach((mapped, key) => {
          const hash = createHash('sha1').update(key).digest('hex');
          deploymentClickHashMap.get(entity).add(hash);
          eventOps.push(createUpsertOpFrom({ hash, mapped, asOf }));
        });
      });
    });
  });
  if (eventOps.length) await db.collection('omeda-email-clicks').bulkWrite(eventOps);
  // remove any clicks that no longer appear in omeda
  // it's been found that some clicks can "disappear" from this API call
  await Promise.all([...deploymentClickHashMap].map(async ([dep, hashSet]) => {
    const filter = { dep, hash: { $nin: [...hashSet] } };
    await db.collection('omeda-email-clicks').deleteMany(filter);
  }));
  return { eventOps, encryptedCustomerIds, identityRecords };
};
