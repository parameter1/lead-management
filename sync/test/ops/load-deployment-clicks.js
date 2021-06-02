const run = require('../_run');
const command = require('../../src/ops/load-deployment-clicks');

run(command, { trackIds: ['IMCD210529004', 'IMCD210529005'] })
  .catch((e) => setImmediate(() => { throw e; }));
