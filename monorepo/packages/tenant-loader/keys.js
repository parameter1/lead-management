const mongodb = require('@lead-management/mongodb/client');

module.exports = async () => {
  const db = await mongodb.db({ name: 'lead-management' });
  return db.collection('tenants').distinct('zone', { disabled: { $ne: true } });
};
