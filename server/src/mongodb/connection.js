const mongoose = require('mongoose');
const { MONGO_DSN } = require('../env');
const { name, version } = require('../../package.json');

module.exports = mongoose.createConnection(MONGO_DSN, {
  appname: `${name} v${version}`,
  bufferMaxEntries: 0, // Default -1
  connectTimeoutMS: 200, // TCP Connection timeout setting (default 30000)
  ignoreUndefined: true,
  readPreference: 'primaryPreferred',
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
