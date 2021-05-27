const { stitchSchemas } = require('@graphql-tools/stitch');

const resolvers = require('../resolvers');
const schemaDirectives = require('../directives');
const typeDefs = require('../definitions');
const loadBehaviorSchema = require('./behavior');
const loadGAMSchema = require('./gam');

module.exports = async () => {
  const [behaviorSubSchema, GAMSubSchema] = await Promise.all([
    loadBehaviorSchema(),
    loadGAMSchema(),
  ]);
  return stitchSchemas({
    subschemas: [behaviorSubSchema, GAMSubSchema],
    typeDefs,
    resolvers,
    schemaDirectives,
  });
};
