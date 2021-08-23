const run = require('../_run');
const command = require('../../commands/upsert-deployment-metrics');

run(command, { tenantKey: 'indm', trackIds: ['IMCD210529004', 'IMCD210529005', 'IMCD210602002'] })
  .catch((e) => setImmediate(() => { throw e; }));
