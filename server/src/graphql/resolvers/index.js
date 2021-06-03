const merge = require('lodash.merge');
const GraphQLJSON = require('graphql-type-json');
const GraphQLDate = require('@parameter1/graphql-type-date');
const GraphQLObjectID = require('@parameter1/graphql-type-objectid');
const { ObjectId } = require('mongoose').SchemaTypes;

const adCreativeTracker = require('./ad-creative-tracker');
const brightcove = require('./brightcove');
const customer = require('./customer');
const emailDeployment = require('./email-deployment');
const excludedEmailDomain = require('./excluded-email-domain');
const gam = require('./gam');
const tag = require('./tag');
const url = require('./url');
const user = require('./user');

module.exports = merge(
  adCreativeTracker,
  brightcove,
  customer,
  emailDeployment,
  excludedEmailDomain,
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
