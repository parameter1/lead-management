const Raven = require('raven');
const env = require('./env');

const { SENTRY_DSN, NODE_ENV } = env;
Raven.config(SENTRY_DSN, {
  shouldSendCallback: () => NODE_ENV === 'production',
}).install();

module.exports = Raven;
