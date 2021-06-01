const omeda = require('../client');
const entityId = require('./entity-id');
const createHash = require('../../utils/create-hash');

module.exports = ({ customerId, emailAddress } = {}) => {
  if (!customerId && !emailAddress) throw new Error('A customer ID or email address is required.');
  if (customerId && emailAddress) throw new Error('You cannot provide both a customer ID and email address');
  return entityId({
    brand: omeda.brand,
    type: 'customer',
    id: customerId ? `${customerId}` : createHash(emailAddress.toLowerCase().trim()),
    idType: customerId ? undefined : 'hashed-email',
  });
};
