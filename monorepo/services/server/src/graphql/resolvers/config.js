const { get } = require('@parameter1/utils');
const loadTenant = require('@lead-management/tenant-loader');
const { TENANT_KEY } = require('../../env');

module.exports = {
  /**
   *
   */
  Query: {
    /**
     *
     */
    currentAppConfig: async () => {
      const tenant = await loadTenant({ key: TENANT_KEY });
      const { doc } = tenant;
      const modules = doc.modules || {};
      return {
        _id: doc._id,
        zone: doc.zone,
        modules: Object.keys(modules).map((key) => ({
          key,
          enabled: get(modules, `${key}.enabled`, false),
          // Other configs, eventually?
        })),
      };
    },
  },
};
