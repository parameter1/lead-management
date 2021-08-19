const { handler } = require('../functions/process-customers');

handler({
  Records: [
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ tenantKey: 'indm', encryptedCustomerId: '8797H3317467C8C' }) },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
