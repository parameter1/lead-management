const {
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  AWS_ACCOUNT_ID: str({ desc: 'The AWS account ID. This is _not_ provided by the lambda runtime' }),

  // when executing in lambda, these values will be provided at runtime
  AWS_ACCESS_KEY_ID: str({ desc: 'This will be provided by the lambda runtime.' }),
  AWS_EXECUTION_ENV: str({ desc: 'This will be provided by the lambda runtime.', default: '' }),
  AWS_REGION: str({ desc: 'The AWS region. This will be provided by the lambda runtime.', default: 'us-east-2' }),
  AWS_SECRET_ACCESS_KEY: str({ desc: 'This will be provided by the lambda runtime.' }),

  LEGACY_MONGO_DSN: str({ desc: 'The legacy "leads-graph" MongoDB DSN to connect to.' }),
  MONGO_DSN: str({ desc: 'The MongoDB DSN to connect to.' }),
  OMEDA_APP_ID: str({ desc: 'The Omeda API App ID.' }),
  OMEDA_BRAND_KEY: str({ desc: 'The Omeda brand database key.' }),
  TENANT_KEY: str({ desc: 'The current tenant key' }),
});
