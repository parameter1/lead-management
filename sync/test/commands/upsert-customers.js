const run = require('./_run');
const command = require('../../src/commands/upsert-customers');

run(command, { customerIds: [1100728937] })
  .catch((e) => setImmediate(() => { throw e; }));
