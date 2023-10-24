const { handler } = require('../functions/process-customers');

handler({
  Records: [
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '8797H3317467C8C' }) },
    { body: JSON.stringify({ tenantKey: 'lynchm', encryptedCustomerId: '4357B1923823E9X' }) },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
