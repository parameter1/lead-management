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
  const encryptedCustomerIds = [...Records.reduce((set, record) => {
    const { encryptedCustomerId } = JSON.parse(record.body);
    if (encryptedCustomerId) set.add(encryptedCustomerId);
    return set;
  }, new Set())];
  log(`Found ${encryptedCustomerIds.length} customer(s) to upsert...`);

  if (encryptedCustomerIds.length) {
    await upsert({ encryptedCustomerIds });
    log('Upsert complete:', encryptedCustomerIds);
  }

  if (!AWS_EXECUTION_ENV) await Promise.all([mongodb.close(), legacy.close()]);
  log('DONE');
};
