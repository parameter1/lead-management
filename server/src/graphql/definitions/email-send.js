const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allEmailSends(pagination: PaginationInput = {}, sort: EmailSendSortInput = {}): EmailSendConnection!
  searchEmailSends(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailSendConnection!

  allEmailSendsForUrl(urlId: String!, pagination: PaginationInput = {}, sort: EmailSendSortInput = {}): EmailSendConnection!
  searchEmailSendsForUrl(urlId: String!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailSendConnection!

  emailSend(input: ModelIdInput!): EmailSend!
}

extend type Mutation {
  refreshEmailSend(input: ModelIdInput!): EmailSend!
}

type EmailSendConnection {
  totalCount: Int!
  edges: [EmailSendEdge]!
  pageInfo: PageInfo!
}

type EmailSendEdge {
  node: EmailSend!
  cursor: String!
}

input EmailSendSortInput {
  field: String! = createdAt
  order: Int! = -1
}

type EmailSend {
  id: String!
  name: String!
  subject: String
  isTestSend: Boolean!
  deployment: EmailDeployment!
  sentDate: Date
  fromName: String
  fromEmail: String
  url: String
  status: String
  metrics: EmailSendMetrics
  externalSource: ExternalSource
  createdAt: Date
  updatedAt: Date
}

type EmailSendMetrics {
  sent: Int
  delivered: Int
  deliveryRate: Float
  uniqueOpens: Int
  uniqueClicks: Int
  unsubscribes: Int
  openRate: Float
  clickToOpenRate: Float
  clickToDeliveredRate: Float
  forwards: Int
  bounces: Int
}

`;
