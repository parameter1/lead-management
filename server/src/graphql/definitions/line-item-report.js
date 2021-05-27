const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  emailLineItemMetricsReport(hash: String!, sort: EmailLineItemMetricsReportSortInput!): EmailLineItemMetricsReport!
  emailLineItemIdentitiesReport(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
  emailLineItemIdentityExportReport(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): EmailLineItemIdentityExportReportConnection!
  emailLineItemActivityReport(hash: String!): EmailLineItemActivityReportConnection!
}

type EmailLineItemMetricsReport {
  sends: [ReportEmailMetricSend!]!
  totals: ReportEmailMetricTotals!
}

type EmailLineItemIdentityExportReportConnection {
  totalCount: Int!
  edges: [EmailLineItemIdentityExportReportEdge]!
  pageInfo: PageInfo!
}

type EmailLineItemIdentityExportReportEdge {
  node: EmailLineItemIdentityExportReportNode!
  cursor: String!
}

type EmailLineItemIdentityExportReportNode {
  identity: Identity!
  urls: [ExtractedUrl]!
  sends: [EmailSend]!
}

input EmailLineItemMetricsReportSortInput {
  field: String! = sentDate
  order: Int! = 1
}

type EmailLineItemActivityReportConnection {
  totalCount: Int!
  edges: [EmailLineItemActivityReportEdge]!
  pageInfo: PageInfo!
}

type EmailLineItemActivityReportEdge {
  node: EmailLineItemActivityReportNode!
  cursor: String!
}

type EmailLineItemActivityReportNode {
  identity: Identity!
  url: ExtractedUrl!
  send: EmailSend!
  last: Date
  clicks: Int
}

`;
