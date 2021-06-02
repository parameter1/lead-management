const { handler } = require('../../src/lambda/poll-deployments');

handler().catch((e) => setImmediate(() => { throw e; }));
