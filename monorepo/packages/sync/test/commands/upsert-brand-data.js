const run = require('../_run');
const command = require('../../commands/upsert-brand-data');

run(command)
  .catch((e) => setImmediate(() => { throw e; }));
