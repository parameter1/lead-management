const run = require('../_run');
const command = require('../../commands/append-click-times');

run(command, { filter: { date: { $gte: new Date('2024-10-07') }, time: { $exists: false } }, tenantKey: 'lynchm' })
  .catch((e) => setImmediate(() => { throw e; }));
