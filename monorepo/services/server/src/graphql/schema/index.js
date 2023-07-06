const { stitchSchemas } = require('@graphql-tools/stitch');
const { getAsObject } = require('@parameter1/utils');
const resolvers = require('../resolvers');
const schemaDirectives = require('../directives');
const typeDefs = require('../definitions');
const loadGAMSchema = require('./gam');

module.exports = async (tenant) => {
  const { enabled: includeGAM } = getAsObject(tenant, 'doc.modules.gam', false);
  return stitchSchemas({
    subschemas: [
      ...(includeGAM ? [await loadGAMSchema()] : []),
    ],
    typeDefs: typeDefs({
      includeGAM,
    }),
    resolvers: resolvers({
      includeGAM,
    }),
    schemaDirectives,
  });
};
