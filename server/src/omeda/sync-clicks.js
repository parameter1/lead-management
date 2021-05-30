const MongoDBClient = require('@parameter1/mongodb/client');
const { MONGO_DSN } = require('../env');
const dayjs = require('../dayjs');
const syncDeploymentClicks = require('./sync-deployment-clicks');

const mongodb = new MongoDBClient({ url: MONGO_DSN });
const { log } = console;

const run = async () => {
  await mongodb.connect();
  const db = await mongodb.db({ name: 'lead-management' });

  // find all deployments over the last 7 days...
  const after = dayjs().subtract(7, 'days').toDate();
  const trackIds = await db.collection('omeda-email-deployments').distinct('_id', {
    'data.Status': { $in: ['Sent', 'Sending'] },
    'data.SentDate': { $gte: after },
  });
  log(`Found ${trackIds.length} deployment(s) to sync clicks for...`);
  await Promise.all(trackIds.map(async (trackId) => {
    await syncDeploymentClicks({ trackId });
  }));
  await mongodb.close();
  log('Click sync complete.');
};

run().catch((e) => setImmediate(() => { throw e; }));
