const mongodb = require('../mongodb');
const omeda = require('../client');
const dayjs = require('../../dayjs');
const syncDeployment = require('./deployment');

const { log } = console;

module.exports = async () => {
  const db = await mongodb.db({ name: 'lead-management' });

  // get the last deployment sent date
  const lastDeployment = await db.collection('omeda-email-deployments').findOne({
    'data.Status': { $in: ['Sent', 'Sending'] },
    'data.SentDate': { $ne: null },
  }, { projection: { 'data.SentDate': 1 }, sort: { 'data.SentDate': -1 } });

  const defaultStart = dayjs().subtract(5, 'days').toDate();
  const start = lastDeployment ? lastDeployment.data.SentDate : defaultStart;

  const { data } = await omeda.resource('email').searchDeployments({
    // add 1 hour clock drift...
    deploymentDateStart: dayjs(start).subtract(1, 'hour').toDate(),
    numResults: 1000,
    statuses: ['SENT_OR_SENDING'],
  });
  log(`Found ${data.length} deployment(s) to sync...`);
  await Promise.all(data.map(async ({ TrackId }) => {
    await syncDeployment({ trackId: TrackId });
  }));
};
