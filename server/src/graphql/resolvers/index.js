const merge = require('lodash.merge');
const GraphQLJSON = require('graphql-type-json');
const GraphQLDate = require('@parameter1/graphql-type-date');
const GraphQLObjectID = require('@parameter1/graphql-type-objectid');
const { ObjectId } = require('mongoose').SchemaTypes;

const user = require('./user');

module.exports = merge(
  user,

  {
    Date: GraphQLDate,
    JSON: GraphQLJSON,
    ObjectID: GraphQLObjectID(ObjectId),
    /**
     *
     */
    Mutation: {
      /**
       *
       */
      ping() {
        return 'pong';
      },
    },

    /**
     *
     */
    Query: {
      /**
       *
       */
      ping() {
        return 'pong';
      },
    },
  },
);
