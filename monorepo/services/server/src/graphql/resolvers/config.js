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
