const omeda = require('../client');
const entityId = require('./entity-id');
const createHash = require('../../utils/create-hash');

module.exports = ({ customerId, emailAddress } = {}) => {
  if (!customerId && !emailAddress) throw new Error('A customer ID or email address is required.');
  return entityId({
    brand: omeda.brand,
    type: 'customer',
    id: `${customerId}` || createHash(emailAddress),
    idType: customerId ? undefined : 'hashed-email',
  });
};
