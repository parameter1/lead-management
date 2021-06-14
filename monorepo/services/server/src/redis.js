const Redis = require('ioredis');
const { REDIS_DSN } = require('./env');

module.exports = new Redis(REDIS_DSN, { lazyConnect: true });
