const mongodb = require('@lead-management/mongodb/client');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

module.exports = async (func, ...args) => {
  log('Connecting to MongoDB...');
  await mongodb.connect();
  log('Running function...');
  const result = await func(...args);
  log(result);
  log('Function complete.');
  await mongodb.close();
  log('DONE');
};
