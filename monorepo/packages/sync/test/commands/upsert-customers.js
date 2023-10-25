const run = require('../_run');
const command = require('../../commands/upsert-customers');

run(() => Promise.all([
  command({ tenantKey: 'indm', encryptedCustomerIds: ['8797H3317467C8C', '5689J2201356C7J'] }),
  command({ tenantKey: 'lynchm', encryptedCustomerIds: ['4357B1923823E9X'] }),
])).catch((e) => setImmediate(() => { throw e; }));
