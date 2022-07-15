require('./newrelic');
const http = require('http');
const bootService = require('@parameter1/terminus/boot-service');
const { log } = require('@parameter1/terminus/utils');
const { filterUri } = require('@parameter1/mongodb/utils');
const newrelic = require('./newrelic');
const loadTenant = require('./load-tenant');
const createSchema = require('./graphql/schema');
const graphql = require('./graphql/server');
const server = require('./server');
const mongoose = require('./mongodb/connection');
const redis = require('./redis');
const pkg = require('../package.json');
const { EXPOSED_PORT, HOST, PORT } = require('./env');

process.on('unhandledRejection', (e) => {
  newrelic.noticeError(e);
  throw e;
});

const pingMongo = () => Promise.all([
  mongoose.db.command({ ping: 1 }),
  mongoose.db.collection('pings').updateOne({ _id: pkg.name }, { $set: { last: new Date() } }, { upsert: true }),
]);

bootService({
  name: pkg.name,
  version: pkg.version,
  server: http.createServer(server),
  host: HOST,
  port: PORT,
  exposedPort: EXPOSED_PORT,
  onError: newrelic.noticeError.bind(newrelic),
  onStart: async () => {
    const [schema, tenant, mongoClient] = await Promise.all([
      createSchema().then((s) => {
        log('GraphQL remote schemas created.');
        return s;
      }),
      loadTenant(),
      mongoose.then((m) => {
        log(`MongoDB connected ${filterUri(m.client)}`);
        return m.client;
      }),
      redis.connect().then(() => log('Redis connected')),
    ]);
    const { dbName } = mongoClient.s.options;
    const expectedDbName = `lead-management-${tenant.doc.zone}`;
    if (dbName !== expectedDbName) {
      throw new Error(`Database to tenant zone mismatch. Expected DB name to be ${expectedDbName} but got ${dbName}`);
    }
    graphql({ app: server, schema, path: '/graphql' });
  },
  onSignal: () => Promise.all([
    mongoose.close().then(() => log('MongoDB disconnected.')),
    redis.quit().then(() => log('Redis disconnected')),
  ]),
  onHealthCheck: () => Promise.all([
    redis.ping().then(() => 'Redis pinged successfully.'),
    pingMongo().then(() => 'MongoDB pinged successfully.'),
  ]),
}).catch((e) => setImmediate(() => {
  newrelic.noticeError(e);
  throw e;
}));
