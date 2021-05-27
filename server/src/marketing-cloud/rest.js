const ienRest = require('./rest-ien');
const ddtRest = require('./rest-ddt');

module.exports = {
  retrieveEmailAsset: async ({ emailId, fields } = {}) => {
    const body = {
      query: {
        property: 'data.email.legacy.legacyId',
        simpleOperator: 'equals',
        value: `${emailId}`,
      },
      fields,
    };
    const ienJson = await ienRest.request({ endpoint: '/asset/v1/content/assets/query', method: 'POST', body });
    if (ienJson.items[0]) return ienJson.items[0];
    const ddtJson = await ddtRest.request({ endpoint: '/asset/v1/content/assets/query', method: 'POST', body });
    return ddtJson.items[0];
  },
};
