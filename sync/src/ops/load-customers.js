const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const omeda = require('../omeda');
const customerEntity = require('../utils/customer-entity');

/**
 * Loads Omeda customer(s) with email, phone number, and address data.
 *
 * @param {object} params
 * @param {number[]} params.customerIds
 * @returns {Map} The customers mapped by customer ID.
 */
module.exports = async (params = {}) => {
  const { customerIds } = await validateAsync(Joi.object({
    customerIds: Joi.array().items(Joi.number().min(1).required()).required(),
  }), params);

  const ids = [...new Set(customerIds)];
  const items = await Promise.all(ids.map(async (customerId) => {
    const response = await omeda.resource('customer').lookupById({ customerId, reQueryOnInactive: true });
    const { data } = response;
    const entity = customerEntity({ customerId: data.Id });

    const [emails, phoneNumbers, postalAddresses, demographics] = await Promise.all([
      response.emails(),
      response.phoneNumbers(),
      response.postalAddresses(),
      response.demographics(),
    ]);
    return {
      customerId,
      entity,
      data,
      emails,
      phoneNumbers,
      postalAddresses,
      demographics,
    };
  }));
  return items.reduce((map, item) => {
    map.set(item.customerId, item);
    return map;
  }, new Map());
};
