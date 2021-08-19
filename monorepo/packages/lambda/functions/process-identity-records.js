const mongodb = require('@lead-management/mongodb/client');
const upsert = require('@lead-management/sync/commands/upsert-identity-records');
const { AWS_EXECUTION_ENV } = require('../env');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  const { Records = [] } = event;
  const perTenant = Records.reduce((map, record) => {
    const { tenantKey, body } = JSON.parse(record.body);
    if (!map.has(tenantKey)) map.set(tenantKey, []);
    map.get(tenantKey).push(body);
    return map;
  }, new Map());

  await Promise.all([...perTenant.keys()].map(async (tenantKey) => {
    const records = perTenant.get(tenantKey);
    log(`Found ${records.length} ${tenantKey} identity records to process...`);
    await upsert({ tenantKey, records });
  }));

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
