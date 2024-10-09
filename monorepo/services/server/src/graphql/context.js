const loadTenant = require('@lead-management/tenant-loader');
const { HOST_NAME, TENANT_KEY } = require('../env');
const loaders = require('./dataloaders');
const brightcove = require('../brightcove/api');
const gam = require('./schema/gam/executor');

module.exports = async ({ req }) => {
  const tenant = await loadTenant({ key: TENANT_KEY });
  const { query } = req;

  let customClickFilterParams;
  if (query.customClickFilterParams) {
    const secondsSinceSentTime = Object.keys(query).filter((key) => {
      if (!/\d+/.test(key)) return false;
      return parseInt(key, 10) >= 0;
    }).reduce((o, key) => ({
      ...o,
      [key]: { allowUnrealCodes: query[key].split(',').filter((v) => v) },
    }), {});
    customClickFilterParams = { allowLegacy: true, secondsSinceSentTime };
  }

  /** @type {LeadsGraphQLContext} */
  return {
    ...(customClickFilterParams && { customClickFilterParams }),
    tenant,
    auth: req.auth,
    host: HOST_NAME,
    loaders,
    gam,
    brightcove,
  };
};

/**
 * @typedef LeadsGraphQLContext
 * @prop {import("../utils/email-clicks").BuildClickFilterParams} [customClickFilterParams]
 * @prop {import("./auth").Auth} [auth]
 * @prop {import("../brightcove/api/index").BrightcoveApis} brightcove
 * @prop {import("./schema/gam/executor").GAMExecutorFunc} gam
 * @prop {import("./dataloaders").LeadsGraphQLDataLoaders} loaders
 * @prop {string} host
 * @prop {import("@lead-management/tenant-loader").LeadsTenant} tenant
 */
