// const omeda = require('@lead-management/omeda');
const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');

/**
 * Loads Omeda customer(s) with email, phone number, and address data.
 *
 * @param {object} params
 * @param {number[]} params.customerIds
 * @param {object} tenant
 * @param {object} tenant.doc
 * @param {object} tenant.db
 * @param {object} tenant.omeda
 * @returns {Map} The customers mapped by customer ID.
 */
module.exports = async (params = {}, { omeda } = {}) => {
  const { encryptedCustomerIds, errorOnNotFound } = await validateAsync(Joi.object({
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
    errorOnNotFound: Joi.boolean().default(true),
  }), params);

  const ids = [...new Set(encryptedCustomerIds)];
  const items = await Promise.all(ids.map(async (encryptedId) => {
    const response = await omeda.resource('customer').lookupByEncryptedId({ encryptedId, errorOnNotFound, reQueryOnInactive: true });
    const { data } = response;
    if (!data.Id) return null; // no customer found. return empty result (will be filtered later)

    // use incoming ID for entity, not the response
    // this is due to customers being merged
    const entity = omeda.entity.customer({ encryptedCustomerId: encryptedId });

    const [emails, phoneNumbers, postalAddresses, demographics] = await Promise.all([
      response.emails(),
      response.phoneNumbers(),
      response.postalAddresses(),
      response.demographics(),
    ]);
    return {
      encryptedId,
      entity,
      data,
      emails,
      phoneNumbers,
      postalAddresses,
      demographics,
    };
  }));
  return items.filter((item) => item).reduce((map, item) => {
    map.set(item.encryptedId, item);
    return map;
  }, new Map());
};
