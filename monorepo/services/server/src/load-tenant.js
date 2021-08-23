const loadTenant = require('@lead-management/tenant-loader');
const { TENANT_KEY } = require('./env');

let promise;

module.exports = async () => {
  if (!promise) promise = loadTenant({ key: TENANT_KEY });
  return promise;
};
