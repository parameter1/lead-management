const omeda = require('@lead-management/omeda');
const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const customerEntity = require('@lead-management/omeda/entity-id/customer');

/**
 * Loads Omeda customer(s) with email, phone number, and address data.
 *
 * @param {object} params
 * @param {number[]} params.customerIds
 * @returns {Map} The customers mapped by customer ID.
 */
module.exports = async (params = {}) => {
  const { encryptedCustomerIds } = await validateAsync(Joi.object({
    encryptedCustomerIds: Joi.array().items(Joi.string().trim().pattern(/[a-z0-9]{15}/i).required()).required(),
  }), params);

  const ids = [...new Set(encryptedCustomerIds)];
  const items = await Promise.all(ids.map(async (encryptedId) => {
    const response = await omeda.resource('customer').lookupByEncryptedId({ encryptedId });
    const { data } = response;
    // use incoming ID for entity, not the response
    // this is due to customers being merged
    const entity = customerEntity({ encryptedCustomerId: encryptedId });

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
  return items.reduce((map, item) => {
    map.set(item.encryptedId, item);
    return map;
  }, new Map());
};
