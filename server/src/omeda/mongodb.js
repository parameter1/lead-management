const MongoDBClient = require('@parameter1/mongodb/client');
const { MONGO_DSN } = require('../env');

module.exports = new MongoDBClient({ url: MONGO_DSN });
