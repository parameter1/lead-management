const { handler } = require('../../src/lambda/process-brand-data');

handler().catch((e) => setImmediate(() => { throw e; }));
