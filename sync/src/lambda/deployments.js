const mongodb = require('../mongodb');
const loadDB = require('../mongodb/load-db');
const dayjs = require('../dayjs');
const loadIds = require('../ops/load-deployment-ids-since');
const upsert = require('../commands/upsert-deployments');

const { log } = console;

exports.handler = async () => {
  const db = await loadDB();

  // get the last omeda deployment saved in the db
  const lastDeployment = await db.collection('omeda-email-deployments').findOne({
    'omeda.Status': { $in: ['Sent', 'Sending'] },
    'omeda.SentDate': { $ne: null, $exists: true },
  }, { projection: { 'omeda.SentDate': 1 }, sort: { 'omeda.SentDate': -1 } });

  const defaultStart = dayjs().subtract(30, 'days').toDate();
  const start = lastDeployment ? lastDeployment.omeda.SentDate : defaultStart;

  const trackIds = await loadIds({ onOrAfter: start });
  log(`Found ${trackIds.length} deployment(s) to upsert.`, trackIds);
  if (trackIds.length) await upsert({ trackIds });
  await mongodb.close();
  log('DONE');
};
