const omeda = require('../omeda');
const entityId = require('./entity-id');
const createHash = require('./create-hash');

module.exports = ({ encryptedCustomerId, emailAddress } = {}) => {
  if (!encryptedCustomerId && !emailAddress) throw new Error('An encrypted customer ID or email address is required.');
  if (encryptedCustomerId && emailAddress) throw new Error('You cannot provide both a customer ID and email address');
  return entityId({
    brand: omeda.brand,
    type: 'customer',
    id: encryptedCustomerId ? `${encryptedCustomerId}` : createHash(emailAddress.toLowerCase().trim()),
    idType: encryptedCustomerId ? 'encrypted' : 'hashed-email',
  });
};
