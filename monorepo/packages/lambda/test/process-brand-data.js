const { handler } = require('../functions/process-brand-data');

handler().catch((e) => setImmediate(() => { throw e; }));
