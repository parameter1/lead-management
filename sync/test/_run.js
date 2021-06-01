const mongodb = require('../src/mongodb');
const legacy = require('../src/mongodb/legacy');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

module.exports = async (func, ...args) => {
  log('Connecting to MongoDB...');
  await Promise.all([
    mongodb.connect(),
    legacy.connect(),
  ]);
  log('Running function...');
  const result = await func(...args);
  log(result);
  log('Function complete.');
  await Promise.all([
    mongodb.close(),
    legacy.close(),
  ]);
  log('DONE');
};
