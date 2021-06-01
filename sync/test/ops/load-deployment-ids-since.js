const run = require('../_run');
const dayjs = require('../../src/dayjs');
const command = require('../../src/ops/load-deployment-ids-since');

run(command, { after: dayjs().subtract(2, 'weeks').toDate() })
  .catch((e) => setImmediate(() => { throw e; }));
