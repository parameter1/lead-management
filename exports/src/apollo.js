const fetch = require('node-fetch');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { createHttpLink } = require('apollo-link-http');
const { GRAPHQL_URL } = require('./env');
const { name, version } = require('../package.json');

const defaultConfig = {
  name,
  version,
  connectToDevTools: false,
};

/**
 * Factory for creating a server-side Apollo GraphQL client.
 *
 *
 * @param {object} params
 * @param {string} params.uri The GraphQL URI to connect to.
 * @param {object} [params.config={}] Additional config options to set to the client.
 * @param {object} [params.linkConfig={}] Additional config options to set to the link.
 * @returns {ApolloClient}
 */
module.exports = ({
  config = {},
  linkConfig = {},
} = {}) => {
  const client = new ApolloClient({
    ...defaultConfig,
    ...config,
    ssrMode: true,
    link: createHttpLink({
      ...linkConfig,
      uri: GRAPHQL_URL,
      fetch,
    }),
    cache: new InMemoryCache(),
  });
  return client;
};
