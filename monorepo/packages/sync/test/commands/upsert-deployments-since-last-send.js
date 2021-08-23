const run = require('../_run');
const command = require('../../commands/upsert-deployments-since-last-send');

run(command, { tenantKey: 'lynchm' })
  .catch((e) => setImmediate(() => { throw e; }));
