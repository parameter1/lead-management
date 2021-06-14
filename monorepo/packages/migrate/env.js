const {
  bool,
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  DESTINATION_DB_NAME: str({ desc: 'The database to write data to.', default: 'lead-management-indm' }),
  DESTINATION_MONGO_URI: str({ desc: 'The MongoDB instance to write data to.' }),
  SOURCE_DB_NAME: str({ desc: 'The database to read data from.', default: 'leads-graph' }),
  SOURCE_MONGO_URI: str({ desc: 'The MongoDB instance to read data from.' }),
  WIPE_DESTINATION_DATA: bool({ desc: 'Whether to wipe destination data before writing.', default: true }),
});
