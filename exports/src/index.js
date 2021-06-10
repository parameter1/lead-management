require('./newrelic');
const bootService = require('@parameter1/terminus/boot-service');
const newrelic = require('./newrelic');
const server = require('./server');
const pkg = require('../package.json');
const { HOST, PORT, EXPOSED_PORT } = require('./env');

process.on('unhandledRejection', (e) => {
  newrelic.noticeError(e);
  throw e;
});

bootService({
  name: pkg.name,
  version: pkg.version,
  server,
  host: HOST,
  port: PORT,
  exposedPort: EXPOSED_PORT,
  onError: newrelic.noticeError.bind(newrelic),
}).catch((e) => setImmediate(() => {
  newrelic.noticeError(e);
  throw e;
}));
