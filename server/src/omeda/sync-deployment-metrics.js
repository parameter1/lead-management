const MongoDBClient = require('@parameter1/mongodb/client');
const { MONGO_DSN } = require('../env');
const omeda = require('./client');

const mongodb = new MongoDBClient({ url: MONGO_DSN });
const { log } = console;

const metrics = [
  'BounceCount',
  'RetryCount',
  'SendingCount',
  'SentCount',
  'TotalClicks',
  'TotalOpens',
  'UniqueClicks',
  'UniqueOpens',
];

module.exports = async ({ trackId } = {}) => {
  const now = new Date();
  const db = await mongodb.db({ name: 'lead-management' });
  log(`Loading email deployment ${trackId} from Omeda...`);
  const { data } = await omeda.resource('email').lookupDeploymentById({ trackId });

  const toSet = metrics.reduce((o, metric) => {
    const key = `data.${metric}`;
    return { ...o, [key]: data[metric] || 0 };
  }, {});

  // upsert deployment.
  log(`Upserting email deployment metrics for ${trackId}...`);
  await db.collection('omeda-email-deployments').updateOne({ _id: data.TrackId }, {
    $setOnInsert: { _id: data.TrackId, createdAt: now },
    $set: { ...toSet, updatedAt: now },
  }, { upsert: true });
  log(`Metric upsert complete for ${trackId}`);
};
