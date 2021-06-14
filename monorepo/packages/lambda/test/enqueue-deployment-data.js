const { handler } = require('../functions/enqueue-deployment-data');

handler().catch((e) => setImmediate(() => { throw e; }));
