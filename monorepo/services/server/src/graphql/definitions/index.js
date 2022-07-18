const { gql } = require('apollo-server-express');

const adCreativeTracker = require('./ad-creative-tracker');
const brightcove = require('./brightcove');
const campaign = require('./campaign');
const customer = require('./customer');
const emailDeployment = require('./email-deployment');
const eventEmailClick = require('./event-email-click');
const excludedEmailDomain = require('./excluded-email-domain');
const exportDefs = require('./exports');
const gam = require('./gam');
const identity = require('./identity');
const leadReport = require('./lead-report');
const lineItem = require('./line-item');
const lineItemReport = require('./line-item-report');
const order = require('./order');
const tag = require('./tag');
const url = require('./url');
const user = require('./user');

module.exports = gql`

directive @apiValue(path: String, as: ApiValueDirectiveAsEnum) on FIELD_DEFINITION

scalar Date
scalar JSON
scalar ObjectID

enum ApiValueDirectiveAsEnum {
  ARRAY
  OBJECT
}

enum SortOrderEnum {
  ASC
  DESC
}

type Query {
  ping: String!
}

type Mutation {
  ping: String!
}

type ExternalSource {
  identifier: String
  namespace: String
  lastRetrievedAt: Date
  createdAt: Date
  updatedAt: Date
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

input ExternalSourceInput {
  identifier: String!
  namespace: String!
}

input ModelIdInput {
  id: String!
}

input PaginationInput {
  first: Int! = 25
  after: String
}

input TypeAheadInput {
  field: String!
  phrase: String!
}

input TypeAheadOptionsInput {
  position: String!
}

${adCreativeTracker}
${brightcove}
${campaign}
${customer}
${emailDeployment}
${eventEmailClick}
${excludedEmailDomain}
${exportDefs}
${gam}
${identity}
${leadReport}
${lineItem}
${lineItemReport}
${order}
${tag}
${url}
${user}

`;
