const { isURL } = require('validator');

const {
  bool,
  port,
  cleanEnv,
  makeValidator,
  str,
} = require('envalid');

// const mongodsn = makeValidator((v) => {
//   const opts = { protocols: ['mongodb'], require_tld: false, require_protocol: true };
//   if (isURL(v, opts)) return v;
//   throw new Error('Expected a Mongo DSN string with mongodb://');
// });

const redisdsn = makeValidator((v) => {
  const opts = { protocols: ['redis'], require_tld: false, require_protocol: true };
  if (isURL(v, opts)) return v;
  throw new Error('Expected a Redis DSN string with redis://');
});

const nonemptystr = makeValidator((v) => {
  const err = new Error('Expected a non-empty string');
  if (v === undefined || v === null || v === '') {
    throw err;
  }
  const trimmed = String(v).trim();
  if (!trimmed) throw err;
  return trimmed;
});

module.exports = cleanEnv(process.env, {
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: true, devDefault: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', devDefault: '(unset)' }),

  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  PORT: port({ desc: 'The port that express will run on.', default: 8288 }),

  MONGO_DSN: nonemptystr({ desc: 'The MongoDB DSN to connect to.' }),
  REDIS_DSN: redisdsn({ desc: 'The Redis DSN to connect to.' }),
  SENTRY_DSN: nonemptystr({ desc: 'The DSN for connecting to Sentry.' }),

  TENANT_KEY: nonemptystr({ desc: 'The tenant key, e.g. ien' }),
  TENANT_NAME: nonemptystr({ desc: 'The tenant display name, e.g. Industrial Equipment News.' }),
  HOST_NAME: nonemptystr({ desc: 'The host name of the server.' }),

  FUEL_PRIMARY_API_CLIENT_ID: nonemptystr({ desc: 'The PRIMARY Marketing Cloud API client ID.' }),
  FUEL_PRIMARY_API_CLIENT_SECRET: nonemptystr({ desc: 'The PRIMARY Marketing Cloud API client secret.' }),

  FUEL_SECONDARY_API_CLIENT_ID: nonemptystr({ desc: 'The SECONDARY Marketing Cloud API client ID.' }),
  FUEL_SECONDARY_API_CLIENT_SECRET: nonemptystr({ desc: 'The SECONDARY Marketing Cloud API client secret.' }),

  FUEL_API_CLIENT_ID: nonemptystr({ desc: 'The Marketing Cloud API client ID.' }),
  FUEL_API_CLIENT_SECRET: nonemptystr({ desc: 'The Marketing Cloud API client secret.' }),
  FUEL_API_AUTH_URL: nonemptystr({ desc: 'The marketing cloud API auth URL.', default: 'https://mclslwbt-9sq6nwzzv1smhy8lwr4.auth.marketingcloudapis.com' }),
  FUEL_API_ACCOUNT_ID_IEN: nonemptystr({ desc: 'The IEN BU account ID.' }),
  FUEL_API_ACCOUNT_ID_DDT: nonemptystr({ desc: 'The DDT BU account ID.' }),

  GAM_GRAPHQL_URI: nonemptystr({ desc: 'The GAM GraphQL API URI.' }),

  WUFOO_API_SUBDOMAIN: nonemptystr({ desc: 'The subdomain part (found before .wufoo.com) for the Wufoo account.' }),
  WUFOO_API_KEY: nonemptystr({ desc: 'The Wufoo API key.' }),
  WUFOO_API_PASSWORD: nonemptystr({ desc: 'The Wufoo API password.' }),

  OH_BEHAVE_API_KEY: nonemptystr({ desc: 'The OhBehave API key.' }),
  OH_BEHAVE_PROPERTY_ID: nonemptystr({ desc: 'The OhBehave API property ID.' }),

  GAM_SERVICE_URL: nonemptystr({ desc: 'The root URL for the Google Ad Manager microservice.' }),
  HONEY_POT_URL_ID: nonemptystr({ desc: 'The honey pot extracted URL ID for tracking bots/scanners' }),

  BRIGHTCOVE_ACCOUNT_ID: nonemptystr({ desc: 'The Brightcove account ID.' }),
  BRIGHTCOVE_APP_ID: nonemptystr({ desc: 'The Brightcove API APP ID.' }),
  BRIGHTCOVE_SECRET: nonemptystr({ desc: 'The Brightcove API secret.' }),
  TRUSTED_PROXIES: str({ desc: 'A comma seperated list of trusted proxy IP addresses.', default: '' }),
});
