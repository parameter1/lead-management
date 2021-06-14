const {
  bool,
  port,
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  EXPOSED_PORT: port({ desc: 'The exposed port that the service will run on.', default: 80, devDefault: 9290 }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  GRAPHQL_URL: str({ desc: 'The leads GraphQL server to connec to.', default: 'http://server/graphql' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
});
