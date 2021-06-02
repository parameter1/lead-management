const { handler } = require('../../src/lambda/process-customers');

handler({
  Records: [
    { body: JSON.stringify({ customerId: 1100728968 }) },
    { body: JSON.stringify({ customerId: 1100728968 }) },
    { body: JSON.stringify({ customerId: 1100728937 }) },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
