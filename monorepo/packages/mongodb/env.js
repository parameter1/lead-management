const {
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  MONGO_DSN: str({ desc: 'The MongoDB DSN to connect to.' }),
  TENANT_KEY: str({ desc: 'The current lead management tenant key' }),
});
