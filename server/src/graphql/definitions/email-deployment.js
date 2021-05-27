const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allEmailDeployments(pagination: PaginationInput = {}, sort: EmailDeploymentSortInput = {}): EmailDeploymentConnection!
  searchEmailDeployments(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailDeploymentConnection!
  emailDeployment(input: ModelIdInput!): EmailDeployment!
  emailDeploymentReport(input: EmailDeploymentReportInput = {}): EmailDeploymentReport
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

input EmailDeploymentSortInput {
  field: String! = createdAt
  order: Int! = -1
}

input EmailDeploymentReportInput {
  start: Date
  end: Date
}

type EmailDeployment {
  id: String!
  name: String!
  sendCount: Int!
  subject: String
  externalSource: ExternalSource
  category: EmailCategory!
  sends: [EmailSend]
  metrics: EmailSendMetrics
  createdAt: Date
  updatedAt: Date
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
  categories: [EmailCategoryReportDetail!]!
}

type EmailCategoryReportDetail {
  id: String!
  name: String!
  deployments: [EmailDeployment!]!
  deploymentCount: Int!

  totalSent: Int
  totalDelivered: Int
  totalUniqueOpens: Int
  totalUniqueClicks: Int

  avgSent: Int
  avgDelivered: Int
  avgUniqueOpens: Int
  avgUniqueClicks: Int

  avgDeliveryRate: Float
  avgUniqueOpenRate: Float
  avgUniqueClickToDeliveredRate: Float
  avgUniqueClickToOpenRate: Float
}

`;
