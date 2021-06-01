const OmedaApiClient = require('@parameter1/omeda-api-client');
const { OMEDA_APP_ID, OMEDA_BRAND_KEY } = require('./env');

module.exports = new OmedaApiClient({
  appId: OMEDA_APP_ID,
  brand: OMEDA_BRAND_KEY,
});
