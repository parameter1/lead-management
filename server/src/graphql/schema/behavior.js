const { introspectSchema } = require('@graphql-tools/wrap');
const { FilterRootFields, RenameTypes, RenameRootFields } = require('@graphql-tools/wrap');
const fetch = require('node-fetch');
const { print } = require('graphql');

const executor = async ({ document, variables, context = {} }) => {
  const { behaviorToken } = context;
  const headers = {
    'content-type': 'application/json',
    ...(behaviorToken && { authorization: `Bearer ${behaviorToken}` }),
  };
  const query = print(document);
  const result = await fetch('https://oh-behave.l0.parameter1.io/graph', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await result.json();
  return json;
};

const rename = (name) => `behavior${name.charAt(0).toUpperCase()}${name.slice(1)}`;

module.exports = async () => ({
  schema: await introspectSchema(executor),
  executor,
  transforms: [
    new FilterRootFields((operation, rootField) => rootField !== 'ping'),
    new RenameTypes((name) => `Behavior${name}`),
    new RenameRootFields((op, name) => rename(name)),
  ],
});
