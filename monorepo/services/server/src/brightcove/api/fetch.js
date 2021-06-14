const fetch = require('node-fetch');
const { getAsArray } = require('@parameter1/utils');
const oauth = require('./oauth');

const cache = {
  token: undefined,
  expires: undefined,
};

const getTokenFromCache = () => {
  const { expires, token } = cache;
  if (!token) return null;
  if (!expires) return null;
  if (Date.now() < expires.valueOf()) return token;
  return null;
};

const getToken = async () => {
  // Attempt to load token from cache.
  const token = getTokenFromCache();
  if (token) return token;

  // No token found (or expired). Load fresh.
  const { access_token: value, expires_in: ttl } = await oauth();
  cache.token = value;
  cache.expires = new Date(Date.now() + ((ttl - 30) * 1000));
  return value;
};

module.exports = async (url, options = {}) => {
  const token = await getToken();
  const headers = { ...options.headers, authorization: `Bearer ${token}` };
  const res = await fetch(url, { ...options, headers });
  const json = await res.json();
  if (!res.ok) {
    const [error] = getAsArray(json);
    const message = error ? `${error.error_code}: ${error.message}` : res.statusText;
    const err = new Error(message);
    err.statusCode = res.status;
    throw err;
  }
  return json;
};
