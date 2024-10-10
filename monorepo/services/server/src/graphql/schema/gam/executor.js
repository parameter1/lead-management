const { print, GraphQLError } = require('graphql');
const fetch = require('node-fetch');
const { GAM_GRAPHQL_URI } = require('../../../env');

/** @type {GAMExecutorFunc} */
module.exports = async ({ document, variables }) => {
  const query = print(document);
  const result = await fetch(GAM_GRAPHQL_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await result.json();
  if (json.errors) throw new GraphQLError(json.errors[0].message);
  return json;
};

/**
 * @callback GAMExecutorFunc
 * @param {GAMExecutorFuncParams} params
 * @returns {Promise<string>}
 *
 * @typedef GAMExecutorFuncParams
 * @prop {import("graphql").DocumentNode} document
 * @prop {Record<string, any>} variables
 */
