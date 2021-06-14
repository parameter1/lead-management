const { handler } = require('../functions/poll-deployments');

handler().catch((e) => setImmediate(() => { throw e; }));
