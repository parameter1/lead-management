const omeda = require('../client');
const customerEntity = require('../utils/customer-entity');

module.exports = async ({ customerId } = {}) => {
  if (!customerId) throw new Error('A customer ID is required.');
  const response = await omeda.resource('customer').lookupById({ customerId, reQueryOnInactive: true });
  const { data } = response;
  const entity = customerEntity({ customerId: data.Id });

  const [emails, phoneNumbers, postalAddresses] = await Promise.all([
    response.emails(),
    response.phoneNumbers(),
    response.postalAddresses(),
  ]);
  return {
    entity,
    data,
    emails,
    phoneNumbers,
    postalAddresses,
  };
};
