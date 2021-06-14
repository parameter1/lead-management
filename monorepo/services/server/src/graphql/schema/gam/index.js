const { introspectSchema } = require('@graphql-tools/wrap');
const { RenameTypes, RenameRootFields } = require('@graphql-tools/wrap');
const executor = require('./executor');

const rename = (name) => `gam${name.charAt(0).toUpperCase()}${name.slice(1)}`;

module.exports = async () => ({
  schema: await introspectSchema(executor),
  executor,
  transforms: [
    new RenameTypes((name) => `GAM${name}`),
    new RenameRootFields((op, name) => rename(name)),
  ],
});
