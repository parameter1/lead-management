const { handler } = require('../functions/process-deployment-data');

handler({
  Records: [
    { body: JSON.stringify({ tenantKey: 'indm', trackId: 'IMCD210526002' }) },
    { body: JSON.stringify({ tenantKey: 'indm', trackId: 'IMCD210529003' }) },
    { body: JSON.stringify({ tenantKey: 'indm', trackId: 'IMCD210529004' }) },
    { body: JSON.stringify({ tenantKey: 'indm', trackId: 'IMCD210529005' }) },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
