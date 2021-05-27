const Fuel = require('./instance');
const env = require('../env');

const {
  FUEL_PRIMARY_API_CLIENT_ID,
  FUEL_PRIMARY_API_CLIENT_SECRET,
  FUEL_SECONDARY_API_CLIENT_ID,
  FUEL_SECONDARY_API_CLIENT_SECRET,
} = env;

const sharedOptions = {
  soapEndpoint: 'https://webservice.s7.exacttarget.com/Service.asmx',
  retry: true,
};

const client = new Fuel({
  ...sharedOptions,
  auth: {
    clientId: FUEL_PRIMARY_API_CLIENT_ID,
    clientSecret: FUEL_PRIMARY_API_CLIENT_SECRET,
    retry: true,
  },
}, {
  ...sharedOptions,
  auth: {
    clientId: FUEL_SECONDARY_API_CLIENT_ID,
    clientSecret: FUEL_SECONDARY_API_CLIENT_SECRET,
    retry: true,
  },
});

module.exports = client;
