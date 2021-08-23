const mongodb = require('@lead-management/mongodb/client');
const loadTenantKeys = require('@lead-management/tenant-loader/keys');
const find = require('@lead-management/sync/commands/get-latest-deployments');
const { AWS_EXECUTION_ENV } = require('../env');
const batchSend = require('../utils/sqs/batch-send');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  // load all tenant keys
  const tenantKeys = await loadTenantKeys();

  // find deployments for the last seven days and queue for all tenants
  await Promise.all(tenantKeys.map(async (tenantKey) => {
    const trackIds = await find({ tenantKey });
    log(`Found ${trackIds.length} ${tenantKey} deployment(s) to queue data for...`);

    if (trackIds.length) {
      await batchSend({
        values: trackIds,
        queueName: 'deployment-data',
        builder: (trackId) => ({
          Id: trackId,
          MessageBody: JSON.stringify({ tenantKey, trackId }),
        }),
      });
      log(`Deployments enqueued successfully for ${tenantKey}.`, trackIds);
    }
  }));

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
