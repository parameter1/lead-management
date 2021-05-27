const fetch = require('node-fetch');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { createHttpLink } = require('apollo-link-http');

module.exports = ({ uri } = {}) => new ApolloClient({
  connectToDevTools: false,
  ssrMode: true,
  link: createHttpLink({ uri, fetch }),
  cache: new InMemoryCache(),
});
