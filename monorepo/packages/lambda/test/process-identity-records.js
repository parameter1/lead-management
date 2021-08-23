const { handler } = require('../functions/process-identity-records');

handler({
  Records: [
    { body: '{"tenantKey":"lynchm","body":{"EmailAddress":"brandon@parameter1.com","FirstName":"Brandon","LastName":"Krigbaum"}}' },
    { body: '{"tenantKey":"lynchm","body":{"EmailAddress":"jacob@parameter1.com","FirstName":"Jacob","LastName":"Bare"}}' },
    { body: '{"tenantKey":"indm","body":{"EmailAddress":"jacob@parameter1.com","FirstName":"Jacob","LastName":"Bare"}}' },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
