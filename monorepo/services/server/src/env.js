const {
  bool,
  cleanEnv,
  port,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  BRIGHTCOVE_ACCOUNT_ID: str({ desc: 'The Brightcove account ID.' }),
  BRIGHTCOVE_APP_ID: str({ desc: 'The Brightcove API APP ID.' }),
  BRIGHTCOVE_SECRET: str({ desc: 'The Brightcove API secret.' }),
  EXPOSED_PORT: port({ desc: 'The exposed port that the server will run on.', default: 80 }),
  EXPORTS_SERVICE_URL: str({ desc: 'The Exports microservice URL', default: 'http://exports' }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  HOST_NAME: str({ desc: 'The host name of the server.' }),
  GAM_GRAPHQL_URI: str({ desc: 'The GAM GraphQL API URI.' }),
  MONGO_DSN: str({ desc: 'The MongoDB DSN to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  OMEDA_APP_ID: str({ desc: 'The Omeda API App ID.' }),
  OMEDA_BRAND_KEY: str({ desc: 'The Omeda brand database key.' }),
  PORT: port({ desc: 'The port that express will run on.', default: 80 }),
  REDIS_DSN: str({ desc: 'The Redis DSN to connect to.' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
});
