const mongodb = require('../mongodb');
const legacy = require('../mongodb/legacy');
const { AWS_EXECUTION_ENV } = require('../env');
const upsert = require('../commands/upsert-identity-records');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await Promise.all([mongodb.connect(), legacy.connect()]);

  const { Records = [] } = event;
  const records = Records.map((record) => JSON.parse(record.body));
  log(`Found ${records.length} identity records to process...`);

  await upsert({ records });

  if (!AWS_EXECUTION_ENV) await Promise.all([mongodb.close(), legacy.close()]);
  log('DONE');
};
