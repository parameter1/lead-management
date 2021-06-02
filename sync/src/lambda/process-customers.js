const mongodb = require('../mongodb');
const legacy = require('../mongodb/legacy');
const { AWS_EXECUTION_ENV } = require('../env');
const upsert = require('../commands/upsert-customers');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await Promise.all([mongodb.connect(), legacy.connect()]);

  const { Records = [] } = event;
  const customerIds = [...Records.reduce((set, record) => {
    const { customerId } = JSON.parse(record.body);
    set.add(customerId);
    return set;
  }, new Set())];
  log(`Found ${customerIds.length} customer(s) to upsert...`);

  await upsert({ customerIds });
  log('Upsert complete:', customerIds);

  if (!AWS_EXECUTION_ENV) await Promise.all([mongodb.close(), legacy.close()]);
  log('DONE');
};
