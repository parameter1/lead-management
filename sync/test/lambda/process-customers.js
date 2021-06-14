const { handler } = require('../../src/lambda/process-customers');

handler({
  Records: [
    { body: JSON.stringify({ encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ encryptedCustomerId: '2804I4421578C9G' }) },
    { body: JSON.stringify({ encryptedCustomerId: '8797H3317467C8C' }) },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
