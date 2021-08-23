const run = require('../_run');
const command = require('../../commands/get-latest-deployments');

run(command, { tenantKey: 'lynchm' })
  .catch((e) => setImmediate(() => { throw e; }));
