require('./newrelic');
const http = require('http');
const bootService = require('@parameter1/terminus/boot-service');
const { log } = require('@parameter1/terminus/utils');
const newrelic = require('./newrelic');
// const createSchema = require('./graphql/schema');
// const graphql = require('./graphql/server');
const server = require('./server');
// const mongoose = require('./mongoose');
// const redis = require('./redis');
// const Raven = require('./raven');
const pkg = require('../package.json');
const { HOST, PORT } = require('./env');

process.on('unhandledRejection', (e) => {
  newrelic.noticeError(e);
  throw e;
});

// const pingMongo = () => Promise.all([
//   mongoose.db.command({ ping: 1 }),
//   mongoose.db.collection('pings').updateOne({ _id: pkg.name }, { $set: { last: new Date() } }, { upsert: true }),
// ]);

bootService({
  name: pkg.name,
  version: pkg.version,
  server: http.createServer(server),
  host: HOST,
  port: PORT,
  onError: newrelic.noticeError.bind(newrelic),
  onStart: async () => {
    // const schema = await createSchema();
    // graphql({ app: server, schema, path: '/graph' });
  },
  onSignal: () => Promise.all([
    // mongoose.close().then(() => log('MongoDB disconnected.')),
    new Promise((resolve, reject) => {
      redis.on('end', resolve);
      redis.on('error', reject);
      redis.quit();
    }).then(() => log('Redis disconnected.')),
  ]),
  onHealthCheck: () => Promise.all([
    // pingMongo().then(() => 'MongoDB pinged successfully.'),
    redis.pingAsync().then(() => 'Redis pinged successfully.'),
  ]),
}).then(() => log('Server ready.')).catch((e) => setImmediate(() => {
  newrelic.noticeError(e);
  throw e;
}));
