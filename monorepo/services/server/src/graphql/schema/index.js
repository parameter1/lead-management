const { stitchSchemas } = require('@graphql-tools/stitch');

const resolvers = require('../resolvers');
const schemaDirectives = require('../directives');
const typeDefs = require('../definitions');
const loadGAMSchema = require('./gam');

module.exports = async () => {
  const GAMSubSchema = await loadGAMSchema();
  return stitchSchemas({
    subschemas: [GAMSubSchema],
    typeDefs,
    resolvers,
    schemaDirectives,
  });
};
