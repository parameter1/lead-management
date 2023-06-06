const Joi = require('@parameter1/joi');
const { ObjectId } = require('@lead-management/mongodb');
const { getAsArray } = require('@parameter1/utils');
const { validateAsync } = require('@parameter1/joi/utils');
const loadTenant = require('@lead-management/tenant-loader');

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
 *
 * @typedef InvalidMappedClick
 * @prop {Date} date
 * @prop {number} n
 *
 * @typedef UpsertClickFilter
 * @prop {import("mongodb").ObjectId} url
 * @prop {string} idt
 * @prop {string} dep
 * @prop {string} split
 */

/**
 * @param {MappedClick} mapped
 */
const createUpsertOpFrom = (mapped) => {
  const { filter, invalid } = mapped;
  return {
    updateOne: {
      filter,
      update: {
        $setOnInsert: filter,
        $set: {
          date: mapped.date,
          n: mapped.n,
          ...(invalid && { invalid: [...invalid].map(([code, click]) => ({ code, ...click })) }),
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
    unrealDeploymentDate: Joi.date().default(new Date('2023-06-01T00:00:00-05:00')),
  }).required(), params);

  const tenant = await loadTenant({ key: tenantKey });
  const { db, omeda } = tenant;

  const items = await loadDeploymentClicks({ trackIds }, tenant);

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
  items.forEach(({ data, entity }) => {
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

          /** @type {MappedClick} */
          const key = getClickKey(click);
          const mapped = clickMap.get(key) || {};
          mapped.filter = getUpsertFilter(click);
          mapped.date = click.ClickDate;
          mapped.n = click.NumberOfClicks;
          clickMap.set(key, mapped);
        });

        if (data.SentDate >= unrealDeploymentDate) {
          /** @type {OmailUnrealClick[]} */
          const unrealClicks = getAsArray(link, 'unrealClicks');
          unrealClicks.forEach((click) => {
            addCustomer(click);

            /** @type {MappedClick} */
            const key = getClickKey(click);
            const mapped = clickMap.get(key) || {};
            mapped.filter = getUpsertFilter(click);
            if (!mapped.n) mapped.n = 0;
            if (!mapped.date) {
              const [mostRecent] = click.UnrealClicks.sort((a, b) => b.ClickDate - a.ClickDate);
              mapped.date = mostRecent.ClickDate;
            }
            const invalid = mapped.invalid || new Map();
            click.UnrealClicks.forEach((detail) => {
              const { Reason: code } = detail;
              invalid.set(code, {
                date: detail.ClickDate,
                n: detail.NumberOfUnrealClicks,
              });
            });
            mapped.invalid = invalid;
            clickMap.set(key, mapped);
          });
        }

        clickMap.forEach((mapped) => {
          eventOps.push(createUpsertOpFrom(mapped));
        });
      });
    });
  });
  if (eventOps.length) await db.collection('omeda-email-clicks').bulkWrite(eventOps);
  return { eventOps, encryptedCustomerIds, identityRecords };
};
