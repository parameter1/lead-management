const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allEmailDeployments(pagination: PaginationInput = {}, sort: EmailDeploymentSortInput = {}): EmailDeploymentConnection!
  searchEmailDeployments(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailDeploymentConnection!
  emailDeployment(input: ModelIdInput!): EmailDeployment!
  # emailDeploymentReport(input: EmailDeploymentReportInput = {}): EmailDeploymentReport
}

type EmailDeployment {
  id: String!
  entity: String!
  name: String!
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

input EmailDeploymentSortInput {
  field: String! = "omeda.CreatedDate"
  order: Int! = -1
}

`;
