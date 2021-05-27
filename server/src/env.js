const {
  cleanEnv,
  port,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  PORT: port({ desc: 'The port that express will run on.', default: 80 }),
  REDIS_DSN: str({ desc: 'The Redis DSN to connect to.' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
});
