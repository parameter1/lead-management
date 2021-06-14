const { createHash } = require('crypto');
const entityId = require('./index');

module.exports = ({ encryptedCustomerId, emailAddress } = {}) => {
  if (!encryptedCustomerId && !emailAddress) throw new Error('An encrypted customer ID or email address is required.');
  if (encryptedCustomerId && emailAddress) throw new Error('You cannot provide both a customer ID and email address');
  return entityId({
    type: 'customer',
    id: encryptedCustomerId || createHash('md5').update(emailAddress.toLowerCase().trim()).digest('hex'),
    idType: encryptedCustomerId ? 'encrypted' : 'hashed-email',
  });
};
