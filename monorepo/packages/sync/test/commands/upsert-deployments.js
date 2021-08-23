const run = require('../_run');
const command = require('../../commands/upsert-deployments');

const trackIds = [
  'IMCD210526002',
  'IMCD210529003',
  'IMCD210529004',
  'IMCD210529005',
  'IMCD210602002',
  'IMCD210609003',
  'IMCD210609002',
  'IMCD210614008',
  'IMCD210614002',
];

run(command, { tenantKey: 'indm', trackIds })
  .catch((e) => setImmediate(() => { throw e; }));
