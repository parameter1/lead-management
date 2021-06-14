const Joi = require('@parameter1/joi');
const { ObjectId } = require('@parameter1/mongodb');
const { getAsArray } = require('@parameter1/utils');
const { validateAsync } = require('@parameter1/joi/utils');

const loadDeploymentClicks = require('../ops/load-deployment-clicks');
const loadDB = require('../mongodb/load-db');
const extractUrlId = require('../utils/extract-url-id');
const customerEntity = require('../utils/customer-entity');

/**
 * Upserts deployment click event data for the provided deployment IDs.
 * Also returns the encrypted customer IDs and customer records associated with the click events
 * that can be used for customer upserting.
 *
 * @param {object} params
 * @param {string[]} params.trackIds
 */
module.exports = async (params = {}) => {
  const { trackIds } = await validateAsync(Joi.object({
    trackIds: Joi.array().items(Joi.string().trim().required()).required(),
  }), params);

  const items = await loadDeploymentClicks({ trackIds });

  const eventOps = [];
  const encryptedCustomerIds = new Set();
  const identityRecords = new Map();
  items.forEach(({ data, entity }) => {
    getAsArray(data, 'splits').forEach((split) => {
      getAsArray(split, 'links').forEach((link) => {
        const urlId = extractUrlId(link.LinkURL);
        if (!urlId) return;
        getAsArray(link, 'clicks').forEach((click) => {
          const {
            EncryptedCustomerId: encryptedCustomerId,
            ClickDate,
            EmailAddress: emailAddress,
            FirstName,
            LastName,
          } = click;
          const idt = encryptedCustomerId
            ? customerEntity({ encryptedCustomerId }) : customerEntity({ emailAddress });

          if (encryptedCustomerId) {
            encryptedCustomerIds.add(encryptedCustomerId);
          } else {
            identityRecords.set(idt, { EmailAddress: emailAddress, FirstName, LastName });
          }
          const filter = {
            url: new ObjectId(urlId),
            idt,
            dep: entity,
            split: split.Split,
          };
          const update = {
            $setOnInsert: filter,
            $set: { date: ClickDate, n: click.NumberOfClicks },
          };
          eventOps.push({ updateOne: { filter, update, upsert: true } });
        });
      });
    });
  });
  const db = await loadDB();
  if (eventOps.length) await db.collection('omeda-email-clicks').bulkWrite(eventOps);
  return { eventOps, encryptedCustomerIds, identityRecords };
};
