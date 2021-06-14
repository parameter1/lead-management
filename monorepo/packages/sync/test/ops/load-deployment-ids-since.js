const run = require('../_run');
const dayjs = require('../../dayjs');
const command = require('../../ops/load-deployment-ids-since');

run(command, { onOrAfter: dayjs().subtract(2, 'weeks').toDate() })
  .catch((e) => setImmediate(() => { throw e; }));
