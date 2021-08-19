const mongodb = require('@lead-management/mongodb/client');
const scaffold = require('@lead-management/sync/commands/scaffold-customers');
const { AWS_EXECUTION_ENV } = require('../env');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  const { Records = [] } = event;
  // needs to split by tenant key
  const perTenant = Records.reduce((map, record) => {
    const { tenantKey, encryptedCustomerId } = JSON.parse(record.body);
    if (!map.has(tenantKey)) map.set(tenantKey, new Set());
    if (encryptedCustomerId) map.get(tenantKey).add(encryptedCustomerId);
    return map;
  }, new Map());

  await Promise.all([...perTenant.keys()].map(async (tenantKey) => {
    const [...encryptedCustomerIds] = perTenant.get(tenantKey);
    log(`Found ${encryptedCustomerIds.length} ${tenantKey} customer(s) to scaffold...`);

    if (encryptedCustomerIds.length) {
      await scaffold({ tenantKey, encryptedCustomerIds });
      log(`Scaffolding for ${tenantKey} complete:`, encryptedCustomerIds);
    }
  }));

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
