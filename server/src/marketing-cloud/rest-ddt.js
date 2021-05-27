const MarkingCloudREST = require('@marketing-cloud/rest');
const {
  FUEL_API_CLIENT_ID,
  FUEL_API_CLIENT_SECRET,
  FUEL_API_AUTH_URL,
  FUEL_API_ACCOUNT_ID_DDT,
} = require('../env');

module.exports = new MarkingCloudREST({
  clientId: FUEL_API_CLIENT_ID,
  clientSecret: FUEL_API_CLIENT_SECRET,
  authUrl: FUEL_API_AUTH_URL,
  accountId: FUEL_API_ACCOUNT_ID_DDT,
});
