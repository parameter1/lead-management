const run = require('../_run');
const command = require('../../src/commands/upsert-deployment-metrics');

run(command, { trackIds: ['IMCD210529004', 'IMCD210529005'] })
  .catch((e) => setImmediate(() => { throw e; }));
