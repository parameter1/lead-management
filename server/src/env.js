const {
  bool,
  cleanEnv,
  port,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  MONGO_DSN: str({ desc: 'The MongoDB DSN to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  PORT: port({ desc: 'The port that express will run on.', default: 80 }),
  REDIS_DSN: str({ desc: 'The Redis DSN to connect to.' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
});
