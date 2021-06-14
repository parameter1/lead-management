const urlParamSchema = require('../schema/url-param');

module.exports = function urlParamsPlugin(schema) {
  schema.add({
    urlParams: {
      type: [urlParamSchema],
    },
  });
};
