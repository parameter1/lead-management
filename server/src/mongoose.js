const mongoose = require('mongoose');
const env = require('./env');
const { name, version } = require('../package.json');

const { MONGO_DSN } = env;

const connection = mongoose.createConnection(MONGO_DSN, {
  autoIndex: process.env.NODE_ENV !== 'production',
  appname: `${name} v${version}`,
  bufferMaxEntries: 0, // Default -1
  connectTimeoutMS: 200, // TCP Connection timeout setting (default 30000)
  ignoreUndefined: true,
  readPreference: 'primaryPreferred', // Allow failover
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

module.exports = connection;
