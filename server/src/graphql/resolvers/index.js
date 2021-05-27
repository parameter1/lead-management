const merge = require('lodash.merge');
const GraphQLJSON = require('graphql-type-json');
const GraphQLDate = require('@parameter1/graphql-type-date');
const GraphQLObjectID = require('@parameter1/graphql-type-objectid');
const { ObjectId } = require('mongodb');

const adCreativeTracker = require('./ad-creative-tracker');
const behavior = require('./behavior');
const brightcove = require('./brightcove');
const campaign = require('./campaign');
const customer = require('./customer');
const emailCategory = require('./email-category');
const emailDeployment = require('./email-deployment');
const emailSend = require('./email-send');
const eventEmailClick = require('./event-email-click');
const excludedEmailDomain = require('./excluded-email-domain');
const form = require('./form');
const formEntry = require('./form-entry');
const gam = require('./gam');
const identity = require('./identity');
const leadReport = require('./lead-report');
const lineItem = require('./line-item');
const lineItemReport = require('./line-item-report');
const order = require('./order');
const tag = require('./tag');
const url = require('./url');
const user = require('./user');
const video = require('./video');
const wufooFields = require('./wufoo-fields');

module.exports = merge(
  adCreativeTracker,
  behavior,
  brightcove,
  campaign,
  customer,
  emailCategory,
  emailDeployment,
  emailSend,
  eventEmailClick,
  excludedEmailDomain,
  form,
  formEntry,
  gam,
  identity,
  leadReport,
  lineItem,
  lineItemReport,
  order,
  tag,
  url,
  user,
  video,
  wufooFields,

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
