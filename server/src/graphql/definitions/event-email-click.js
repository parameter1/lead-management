const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  emailClickEventReport(input: EmailClickEventReportQueryInput!): [EmailClickEventReportRow!]!
}

type EmailClickEventReportRow {
  id: String!
  url: ExtractedUrl!
  deployment: EmailDeployment!
  clicks: Int!
  uniqueClicks: Int!
}

input EmailClickEventReportQueryInput {
  start: Date!
  end: Date!

  includeNewsletters: Boolean = true
  tagIds: [ObjectID!] = []
  customerIds: [ObjectID!] = []
}

`;
