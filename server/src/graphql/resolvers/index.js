const merge = require('lodash.merge');
const GraphQLJSON = require('graphql-type-json');
const GraphQLDate = require('@parameter1/graphql-type-date');
const GraphQLObjectID = require('@parameter1/graphql-type-objectid');
const { ObjectId } = require('mongoose').SchemaTypes;

const adCreativeTracker = require('./ad-creative-tracker');
const behavior = require('./behavior');
const brightcove = require('./brightcove');
const customer = require('./customer');
const gam = require('./gam');
const tag = require('./tag');
const url = require('./url');
const user = require('./user');

module.exports = merge(
  adCreativeTracker,
  behavior,
  brightcove,
  customer,
  gam,
  tag,
  url,
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
