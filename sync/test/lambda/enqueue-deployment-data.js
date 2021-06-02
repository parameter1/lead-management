const { handler } = require('../../src/lambda/enqueue-deployment-data');

handler().catch((e) => setImmediate(() => { throw e; }));
