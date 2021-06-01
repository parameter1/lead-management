const MongoDBClient = require('@parameter1/mongodb/client');
const { LEGACY_MONGO_DSN } = require('../env');

module.exports = new MongoDBClient({ url: LEGACY_MONGO_DSN });
