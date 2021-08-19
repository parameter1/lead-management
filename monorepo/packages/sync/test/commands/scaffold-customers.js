const run = require('../_run');
const command = require('../../commands/scaffold-customers');

run(command, { tenantKey: 'indm', encryptedCustomerIds: ['8797H3317467C8C', '5689J2201356C7J'] })
  .catch((e) => setImmediate(() => { throw e; }));
