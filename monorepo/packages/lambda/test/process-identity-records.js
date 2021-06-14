const { handler } = require('../functions/process-identity-records');

handler({
  Records: [
    { body: '{"EmailAddress":"brandon@parameter1.com","FirstName":"Brandon","LastName":"Krigbaum"}' },
    { body: '{"EmailAddress":"jacob@parameter1.com","FirstName":"Jacob","LastName":"Bare"}' },
  ],
}).catch((e) => setImmediate(() => { throw e; }));
