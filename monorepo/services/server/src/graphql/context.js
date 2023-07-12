const loadTenant = require('@lead-management/tenant-loader');
const { HOST_NAME, TENANT_KEY } = require('../env');
const loaders = require('./dataloaders');
const brightcove = require('../brightcove/api');
const gam = require('./schema/gam/executor');

module.exports = async ({ req }) => {
  const tenant = await loadTenant({ key: TENANT_KEY });
  return {
    tenant,
    auth: req.auth,
    host: HOST_NAME,
    loaders,
    gam,
    brightcove,
  };
};
