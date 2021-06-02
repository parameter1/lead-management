const mongodb = require('../mongodb');
const loadDB = require('../mongodb/load-db');
const dayjs = require('../dayjs');
const { AWS_EXECUTION_ENV } = require('../env');
const batchSend = require('../utils/sqs/batch-send');

const { log } = console;

exports.handler = async (event, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  const db = await loadDB();

  // find all deployments in the leads database over the last 7 days...
  const onOrAfter = dayjs().subtract(7, 'days').toDate();
  const trackIds = await db.collection('omeda-email-deployments').distinct('omeda.TrackId', {
    'omeda.Status': { $in: ['Sent', 'Sending'] },
    'omeda.SentDate': { $gte: onOrAfter },
  });
  log(`Found ${trackIds.length} deployment(s) to queue data for...`);

  if (trackIds.length) {
    await batchSend({
      values: trackIds,
      queueName: 'deployment-data',
      builder: (trackId) => ({
        Id: trackId,
        MessageBody: JSON.stringify({ trackId }),
      }),
    });
    log('Deployments enqueued successfully.', trackIds);
  }

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
