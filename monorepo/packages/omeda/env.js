const {
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  OMEDA_APP_ID: str({ desc: 'The Omeda API App ID.' }),
  OMEDA_BRAND_KEY: str({ desc: 'The Omeda brand database key.' }),
});
