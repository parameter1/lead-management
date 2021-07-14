const mongodb = require('@lead-management/mongodb/client');
const scaffold = require('@lead-management/sync/commands/scaffold-customers');
const { AWS_EXECUTION_ENV } = require('../env');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

exports.handler = async (event = {}, context = {}) => {
  // see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;
  await mongodb.connect();

  const { Records = [] } = event;
  const encryptedCustomerIds = [...Records.reduce((set, record) => {
    const { encryptedCustomerId } = JSON.parse(record.body);
    if (encryptedCustomerId) set.add(encryptedCustomerId);
    return set;
  }, new Set())];
  log(`Found ${encryptedCustomerIds.length} customer(s) to scaffold...`);

  if (encryptedCustomerIds.length) {
    await scaffold({ encryptedCustomerIds });
    log('Scaffolding complete:', encryptedCustomerIds);
  }

  if (!AWS_EXECUTION_ENV) await mongodb.close();
  log('DONE');
};
