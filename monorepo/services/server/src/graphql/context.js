const loadTenant = require('@lead-management/tenant-loader');
const { HOST_NAME, TENANT_KEY } = require('../env');
const loaders = require('./dataloaders');
const brightcove = require('../brightcove/api');
const gam = require('./schema/gam/executor');

module.exports = async ({ req }) => {
  const tenant = await loadTenant({ key: TENANT_KEY });
  const { query } = req;

  let customClickFilter;
  if (query.customClickFilter) {
    const secondsSinceSentTime = Object.keys(query).filter((key) => {
      if (!/\d+/.test(key)) return false;
      return parseInt(key, 10) >= 0;
    }).reduce((o, key) => ({
      ...o,
      [key]: { allowUnrealCodes: query[key].split(',').filter((v) => v) },
    }), {});
    customClickFilter = { secondsSinceSentTime };
  }

  return {
    ...(customClickFilter && { customClickFilter }),
    tenant,
    auth: req.auth,
    host: HOST_NAME,
    loaders,
    gam,
    brightcove,
  };
};
