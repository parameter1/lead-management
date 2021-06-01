const mongodb = require('../../src/mongodb');
const legacy = require('../../src/mongodb/legacy');

const { log } = console;

process.on('unhandledRejection', (e) => { throw e; });

module.exports = async (command, ...args) => {
  log('Connecting to MongoDB...');
  await Promise.all([
    mongodb.connect(),
    legacy.connect(),
  ]);
  log('Running command...');
  await command(...args);
  log('Command complete.');
  await Promise.all([
    mongodb.close(),
    legacy.close(),
  ]);
  log('DONE');
};
