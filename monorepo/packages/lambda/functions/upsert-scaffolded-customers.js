const mongodb = require('@lead-management/mongodb/client');
const loadTenantKeys = require('@lead-management/tenant-loader/keys');
const upsert = require('@lead-management/sync/commands/upsert-scaffolded-customers');
const { AWS_EXECUTION_ENV } = require('../env');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  // load all tenant keys
  const tenantKeys = await loadTenantKeys();

  // upsert for all tenants
  await Promise.all(tenantKeys.map(async (tenantKey) => {
    await upsert({ tenantKey });
  }));

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
