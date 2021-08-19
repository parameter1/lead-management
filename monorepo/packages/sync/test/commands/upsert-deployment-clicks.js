const run = require('../_run');
const command = require('../../commands/upsert-deployment-clicks');

run(command, { tenantKey: 'indm', trackIds: ['IMCD210315002', 'IMCD210526002', 'IMCD210529003', 'IMCD210529004', 'IMCD210529005', 'IMCD210602002'] })
  .catch((e) => setImmediate(() => { throw e; }));
