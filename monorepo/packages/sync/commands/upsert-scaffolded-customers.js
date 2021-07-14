const loadDB = require('@lead-management/mongodb/load-db');
const batch = require('../utils/batch');
const upsert = require('./upsert-customers');

module.exports = async () => {
  const db = await loadDB();

  const limit = 50;
  const query = { '_sync.scaffoldOnly': true };
  const totalCount = await db.collection('identities').countDocuments(query);

  const retriever = async () => db.collection('identities').find(query, {
    sort: { _id: 1 },
    limit,
    projection: { entity: 1 },
  });

  const handler = async ({ results: cursor }) => {
    const docs = await cursor.toArray();
    const encryptedCustomerIds = docs.map(({ entity }) => {
      const [, id] = entity.split('*');
      const [encryptedCustomerId] = id.split('~');
      return encryptedCustomerId;
    });
    await upsert({
      encryptedCustomerIds,
      $set: { '_sync.scaffoldOnly': false, '_sync.scaffoldProcessed': true },
      errorOnNotFound: false,
    });
  };

  await batch({
    name: 'upsert-scaffolded-customers',
    totalCount,
    limit,
    handler,
    retriever,
  });
};
