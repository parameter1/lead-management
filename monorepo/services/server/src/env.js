const {
  bool,
  cleanEnv,
  port,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  BRIGHTCOVE_ACCOUNT_ID: str({ desc: 'The Brightcove account ID.' }),
  BRIGHTCOVE_APP_ID: str({ desc: 'The Brightcove API APP ID.' }),
  BRIGHTCOVE_SECRET: str({ desc: 'The Brightcove API secret.' }),
  EXPOSED_PORT: port({ desc: 'The exposed port that the server will run on.', default: 80 }),
  EXPORTS_SERVICE_URL: str({ desc: 'The Exports microservice URL', default: 'http://exports' }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  HOST_NAME: str({ desc: 'The host name of the server.' }),
  GAM_GRAPHQL_URI: str({ desc: 'The GAM GraphQL API URI.' }),
  MONGO_DSN: str({ desc: 'The MongoDB DSN to connect to.' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),
  PORT: port({ desc: 'The port that express will run on.', default: 80 }),
  REDIS_DSN: str({ desc: 'The Redis DSN to connect to.' }),
  TENANT_KEY: str({ desc: 'The active tenant key' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
  AWS_REGION: str({ desc: 'The AWS region to access', default: 'us-east-1' }),
  AWS_ACCESS_KEY_ID: str({ desc: 'The AWS access key to use.' }),
  AWS_SECRET_ACCESS_KEY: str({ desc: 'The AWS secret access key to use.' }),
  EXPORTS_S3_BUCKET: str({ desc: 'The S3 bucket to store exports.', default: 'lead-management-exports' }),
  ALLOW_UNREAL_CLICK_CODES: bool({ desc: 'If enabled, include certain unreal clicks in lead reports.', default: false }),
});
