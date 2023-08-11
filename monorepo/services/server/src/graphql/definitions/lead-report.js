const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  reportEmailIdentities(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
  reportEmailIdentityExport(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): ReportEmailIdentityExportConnection!
  reportEmailActivity(hash: String!): ReportEmailActivityConnection!
  reportEmailMetrics(hash: String!, sort: ReportEmailMetricsSortInput!, starting: Date, ending: Date): ReportEmailMetrics!
  # reportForms(hash: String!): [Form]!

  reportAdIdentities(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
}

type ReportEmailMetrics {
  deployments: [ReportEmailMetricDeployment!]!
  totals: ReportEmailMetricTotals!
  campaign: Campaign!
}

type ReportEmailMetricTotals {
  identities: Int!
  sends: Int!
  clicks: Int!
  advertiserClickRate: Float!
  metrics: EmailDeploymentMetrics!
}

type ReportEmailMetricDeployment {
  identities: Int!
  clicks: Int!
  advertiserClickRate: Float!
  deployment: EmailDeployment!
}

type ReportEmailIdentityExportConnection {
  totalCount: Int!
  edges: [ReportEmailIdentityExportEdge]!
  pageInfo: PageInfo!
}

type ReportEmailIdentityExportEdge {
  node: ReportEmailIdentityExportNode!
  cursor: String!
}

type ReportEmailIdentityExportNode {
  clicks: Int!
  identity: Identity!
  urls: [ExtractedUrl]!
  deployments: [EmailDeployment]!
}

type ReportEmailActivityConnection {
  totalCount: Int!
  edges: [ReportEmailActivityEdge]!
  pageInfo: PageInfo!
}

type ReportEmailActivityEdge {
  node: ReportEmailActivityNode!
  cursor: String!
}

type ReportEmailActivityNode {
  identity: Identity!
  url: ExtractedUrl!
  deployment: EmailDeployment!
  last: Date
  clicks: Int
}

input ReportEmailMetricsSortInput {
  field: String! = sentDate
  order: Int! = 1
}

`;
