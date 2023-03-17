const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allEmailDeployments(
    pagination: PaginationInput = {}
    sort: EmailDeploymentSortInput = {}
    urlIds: [String!] = []
  ): EmailDeploymentConnection!
  searchEmailDeployments(
    pagination: PaginationInput = {},
    search: TypeAheadInput!,
    options: TypeAheadOptionsInput
    urlIds: [String!] = []
  ): EmailDeploymentConnection!
  emailDeployment(input: ModelIdInput!): EmailDeployment!
  emailDeploymentReport(input: EmailDeploymentReportInput = {}): EmailDeploymentReport

  searchEmailDeploymentTypes(
    pagination: PaginationInput = {}
    search: TypeAheadInput!
    options: TypeAheadOptionsInput
  ): EmailDeploymentTypeConnection!
}

extend type Mutation {
  refreshEmailDeployment(input: ModelIdInput!): EmailDeployment!
}

type EmailDeployment {
  id: String!
  entity: String!
  name: String!
  url: String!
  sentDate: Date
  splitCount: Int!
  subject: String
  splits: [EmailDeploymentSplit!]!
  metrics: EmailDeploymentMetrics!
  status: String!
  typeId: Int!
  typeDescription: String!
  designation: String! # e.g. Newsletter, Third-Party, etc.
  createdAt: Date
  updatedAt: Date
  lastRetrievedAt: Date
}

type EmailDeploymentType {
  id: String!
  omedaId: Int!
  entity: String!
  name: String!
  description: String
  statusCode: Int
}

type EmailDeploymentMetrics {
  sent: Int!
  delivered: Int!
  deliveryRate: Float!
  opens: Int!
  clicks: Int!
  uniqueOpens: Int!
  uniqueClicks: Int!
  unsubscribes: Int!
  openRate: Float!
  clickToOpenRate: Float!
  clickToDeliveredRate: Float!
  bounces: Int!
}

type EmailDeploymentReport {
  start: Date!
  end: Date!
  weeks: [EmailDeploymentReportWeek]
}

type EmailDeploymentReportWeek {
  id: String!
  year: Int!
  number: Int!
  starting: Date!
  ending: Date!
  lastRetrievedAt: Date
  types: [EmailDeploymentTypeReportDetail!]!
}

type EmailDeploymentTypeReportDetail {
  id: String!
  name: String!
  deployments: [EmailDeployment!]!
  deploymentCount: Int!

  totalSent: Int
  totalDelivered: Int
  totalUniqueOpens: Int
  totalUniqueClicks: Int

  avgSent: Float
  avgDelivered: Float
  avgUniqueOpens: Float
  avgUniqueClicks: Float

  avgDeliveryRate: Float
  avgUniqueOpenRate: Float
  avgUniqueClickToDeliveredRate: Float
  avgUniqueClickToOpenRate: Float
}

type EmailDeploymentSplit {
  fromName: String!
  fromEmail: String!
  subject: String!
}

type EmailDeploymentConnection {
  totalCount: Int!
  edges: [EmailDeploymentEdge]!
  pageInfo: PageInfo!
}

type EmailDeploymentEdge {
  node: EmailDeployment!
  cursor: String!
}

type EmailDeploymentTypeConnection {
  totalCount: Int!
  edges: [EmailDeploymentTypeEdge]!
  pageInfo: PageInfo!
}

type EmailDeploymentTypeEdge {
  node: EmailDeploymentType!
  cursor: String!
}

input EmailDeploymentReportInput {
  start: Date
  end: Date

  "The EmailDeploymentType entities that should be included/excluded from the query."
  includeDeploymentTypeEntities: [String!]! = []
  excludeDeploymentTypeEntities: [String!]! = []
}

input EmailDeploymentSortInput {
  field: String! = "omeda.CreatedDate"
  order: Int! = -1
}

`;
