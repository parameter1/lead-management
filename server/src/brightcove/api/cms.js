const { URLSearchParams } = require('url');
const fetch = require('./fetch');
const { BRIGHTCOVE_ACCOUNT_ID } = require('../../env');

const BASE_URI = 'https://cms.api.brightcove.com/v1';

const buildUrl = ({ endpoint, params }) => {
  const query = params ? `?${params}` : '';
  return `${BASE_URI}/${endpoint}${query}`;
};

module.exports = {
  /**
   *
   */
  getVideoById: async ({ id } = {}) => {
    const endpoint = `accounts/${BRIGHTCOVE_ACCOUNT_ID}/videos/${id}`;
    const url = buildUrl({ endpoint });
    return fetch(url);
  },

  /**
   *
   */
  getVideos: async ({
    limit = 20,
    offset = 0,
    sort = 'created_at',
    q,
    query,
  } = {}) => {
    const endpoint = `accounts/${BRIGHTCOVE_ACCOUNT_ID}/videos`;
    const params = new URLSearchParams({ limit, offset, sort });
    if (q && query) throw new Error('You cannont specify both a `q` and `query` param.');
    if (q) params.set('q', q);
    if (query) params.set('query', query);
    const url = buildUrl({ endpoint, params });
    return fetch(url);
  },

  /**
   *
   */
  getVideoCount: async ({
    sort = 'created_at',
    q,
    query,
  } = {}) => {
    const endpoint = `accounts/${BRIGHTCOVE_ACCOUNT_ID}/counts/videos`;
    const params = new URLSearchParams({ sort });
    if (q && query) throw new Error('You cannont specify both a `q` and `query` param.');
    if (q) params.set('q', q);
    if (query) params.set('query', query);
    const url = buildUrl({ endpoint, params });
    return fetch(url);
  },
};
