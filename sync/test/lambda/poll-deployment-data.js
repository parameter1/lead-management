const { handler } = require('../../src/lambda/poll-deployment-data');

handler().catch((e) => setImmediate(() => { throw e; }));
