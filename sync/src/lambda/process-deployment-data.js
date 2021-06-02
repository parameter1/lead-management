const mongodb = require('../mongodb');
const { AWS_EXECUTION_ENV } = require('../env');
const batchSend = require('../utils/sqs/batch-send');
const upsertClicks = require('../commands/upsert-deployment-clicks');
const upsertMetrics = require('../commands/upsert-deployment-metrics');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  const { Records = [] } = event;
  const trackIds = [...Records.reduce((set, record) => {
    const { trackId } = JSON.parse(record.body);
    set.add(trackId);
    return set;
  }, new Set())];
  log(`Found ${trackIds.length} deployment(s) to process data for...`);

  const [{ customerIds, identityRecords }] = await Promise.all([
    upsertClicks({ trackIds }),
    upsertMetrics({ trackIds }),
  ]);

  const enqueuePromises = [];
  if (customerIds.size) {
    enqueuePromises.push(batchSend({
      values: [...customerIds],
      queueName: 'customer-ids',
      builder: (customerId) => ({
        Id: `${customerId}`,
        MessageBody: JSON.stringify({ customerId }),
      }),
    }));
    log('Enqueued customer IDs:', customerIds);
  }
  if (identityRecords.size) {
    enqueuePromises.push(batchSend({
      values: Array.from(identityRecords, ([id, body]) => ({ id, body })),
      queueName: 'identity-records',
      builder: ({ id, body }) => ({
        Id: id.replace('~hashed-email', '').replace(/[.*]/g, '-'),
        MessageBody: JSON.stringify(body),
      }),
    }));
    log('Enqueued identity records:', identityRecords);
  }
  if (enqueuePromises.length) await Promise.all(enqueuePromises);
  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
