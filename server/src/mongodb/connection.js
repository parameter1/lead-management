const mongoose = require('mongoose');
const { MONGO_DSN, isProduction } = require('../env');
const { name, version } = require('../../package.json');

module.exports = mongoose.createConnection(MONGO_DSN, {
  appname: `${name} v${version}`,
  autoIndex: !isProduction,
  bufferMaxEntries: 0, // Default -1
  connectTimeoutMS: 200, // TCP Connection timeout setting (default 30000)
  ignoreUndefined: true,
  readPreference: 'primaryPreferred',
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
