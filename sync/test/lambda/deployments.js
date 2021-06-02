const { handler } = require('../../src/lambda/deployments');

handler().catch((e) => setImmediate(() => { throw e; }));
