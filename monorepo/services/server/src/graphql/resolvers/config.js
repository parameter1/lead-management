const { get } = require('@parameter1/utils');

module.exports = {
  /**
   *
   */
  Query: {
    /**
     *
     */
    currentAppConfig: async (root, _, { tenant }) => {
      const { doc } = tenant;
      const modules = doc.modules || {};
      const settings = doc.settings || {};
      return {
        _id: doc._id,
        zone: doc.zone,
        modules: Object.keys(modules).map((key) => ({
          key,
          enabled: get(modules, `${key}.enabled`, false),
          // Other configs, eventually?
        })),
        settings: Object.keys(settings).map((key) => ({
          key,
          value: get(modules, `${key}.value`),
        })),
      };
    },
  },
};
