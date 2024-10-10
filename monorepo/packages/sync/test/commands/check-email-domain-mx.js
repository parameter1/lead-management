const run = require('../_run');
const command = require('../../commands/check-email-domain-mx');

run(command, { tenantKey: 'indm' })
  .catch((e) => setImmediate(() => { throw e; }));
