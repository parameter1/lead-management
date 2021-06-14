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
  const records = Records.map((record) => JSON.parse(record.body));
  log(`Found ${records.length} identity records to process...`);

  await upsert({ records });

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
