const { client } = require('@parameter1/micro/json');
const { EXPORTS_SERVICE_URL } = require('./env');

module.exports = {
  exports: client({ url: EXPORTS_SERVICE_URL }),
};
