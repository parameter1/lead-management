const { URLSearchParams } = require('url');
const fetch = require('./fetch');
const { BRIGHTCOVE_ACCOUNT_ID } = require('../../env');

const BASE_URI = 'https://analytics.api.brightcove.com/v1';

const buildUrl = ({ endpoint, params }) => {
  const query = params ? `?${params}` : '';
  return `${BASE_URI}/${endpoint}${query}`;
};

const analytics = {
  /**
   * @todo return full response obj along with passed params
   *
   * @param {object} params
   * @param {string[]} params.dimensions
   * @param {object[]} params.where
   * @param {string[]} [params.fields=[]]
   * @param {number} [params.limit=10]
   * @param {number} [params.offset=0]
   * @param {Date} [params.from]
   * @param {Date} [params.to]
   * @param {boolean} [params.reconciled]
   * @param {string} [params.format=json]
   */
  getReport: async ({
    dimensions = [],
    where,
    fields = [],
    limit = 10,
    offset = 0,
    sort = [],
    from,
    to,
    reconciled,
    format = 'json',
  } = {}) => {
    const params = new URLSearchParams({
      accounts: BRIGHTCOVE_ACCOUNT_ID,
      dimensions: dimensions.join(','),
      where: where.map((o) => `${o.key}==${o.values.join(',')}`).join(','),
      limit,
      offset,
      format,
    });
    if (fields && fields.length) params.set('fields', fields.join(','));
    if (from) params.set('from', from.valueOf());
    if (to) params.set('to', to.valueOf());
    if (reconciled != null) params.set('reconciled', reconciled);
    if (sort && sort.length) {
      params.set('sort', sort.filter(({ field }) => field).map(({ field, order }) => {
        if (order && order.toLowerCase() === 'desc') return `-${field}`;
        return field;
      }).join(','));
    }

    const url = buildUrl({ endpoint: 'data', params });
    return fetch(url);
  },
};

module.exports = analytics;

/**
 * @typedef {typeof analytics} BrightcoveAnalyticsApi
 */
