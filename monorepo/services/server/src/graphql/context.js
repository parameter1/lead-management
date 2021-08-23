const env = require('../env');
const loaders = require('./dataloaders');
const brightcove = require('../brightcove/api');
const gam = require('./schema/gam/executor');
const loadTenant = require('../load-tenant');

module.exports = async ({ req }) => {
  const tenant = await loadTenant();
  return {
    tenant,
    auth: req.auth,
    host: env.HOST_NAME,
    loaders,
    gam,
    brightcove,
  };
};
