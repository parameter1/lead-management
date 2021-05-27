const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  reportEmailIdentities(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
  reportEmailIdentityExport(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): ReportEmailIdentityExportConnection!
  reportEmailActivity(hash: String!): ReportEmailActivityConnection!
  reportEmailMetrics(hash: String!, sort: ReportEmailMetricsSortInput!): ReportEmailMetrics!
  reportForms(hash: String!): [Form]!

  reportAdIdentities(hash: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
}

type ReportEmailMetrics {
  sends: [ReportEmailMetricSend!]!
  totals: ReportEmailMetricTotals!
}

type ReportEmailMetricTotals {
  identities: Int!
  sends: Int!
  clicks: Int!
  advertiserClickRate: Float!
  metrics: EmailSendMetrics
}

type ReportEmailMetricSend {
  identities: Int!
  clicks: Int!
  advertiserClickRate: Float!
  send: RolledUpEmailSend!
}

type RolledUpEmailSend {
  id: String!
  name: String!
  sentDate: Date
  isNewsletter: Boolean
  url: String
  metrics: EmailSendMetrics
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
  identity: Identity!
  urls: [ExtractedUrl]!
  sends: [EmailSend]!
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
  send: EmailSend!
  last: Date
  clicks: Int
}

input ReportEmailMetricsSortInput {
  field: String! = sentDate
  order: Int! = 1
}

`;
