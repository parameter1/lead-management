const { handler } = require('../functions/upsert-scaffolded-customers');

handler().catch((e) => setImmediate(() => { throw e; }));
