const OmedaApiClient = require('@parameter1/omeda-api-client');
const { createHash } = require('crypto');

/**
 * @typedef {OmedaApiClient} OmedaApiClient
 */

/**
 * @param {object} params
 * @param {string} params.appId
 * @param {string} params.brand
 * @returns {OmedaApiClient}
 */
module.exports = ({ appId, brand } = {}) => {
  const client = new OmedaApiClient({
    appId,
    brand,
  });

  const entity = ({
    type,
    id,
    idType,
  } = {}) => {
    if (!type) throw new Error('A type must be provided.');
    if (!id) throw new Error('An id must be provided.');
    const ns = ['omeda', client.brand, type].map((v) => `${v}`.trim().toLowerCase()).join('.');
    const eid = [id, idType].filter((v) => v).map((v) => `${v}`.trim()).join('~');
    return `${ns}*${eid}`;
  };

  client.entity = {
    default: entity,
    customer: ({ encryptedCustomerId, emailAddress } = {}) => {
      if (!encryptedCustomerId && !emailAddress) throw new Error('An encrypted customer ID or email address is required.');
      if (encryptedCustomerId && emailAddress) throw new Error('You cannot provide both a customer ID and email address');
      return entity({
        type: 'customer',
        id: encryptedCustomerId || createHash('md5').update(emailAddress.toLowerCase().trim()).digest('hex'),
        idType: encryptedCustomerId ? 'encrypted' : 'hashed-email',
      });
    },
    demographic: ({ id } = {}) => entity({
      type: 'demographic',
      id,
    }),
    deployment: ({ trackId } = {}) => entity({
      type: 'deployment',
      id: trackId,
    }),
    deploymentType: ({ id } = {}) => entity({
      type: 'deployment-type',
      id,
    }),
    product: ({ id } = {}) => entity({
      type: 'product',
      id,
    }),
  };
  return client;
};
