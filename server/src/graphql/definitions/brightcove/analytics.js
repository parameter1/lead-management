const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  brightcoveAnalyticsReport(input: BrightcoveAnalyticsReportQueryInput!): BrightcoveAnalyticsReport!
}

enum BrightcoveAnalyticsReportWhereKeyEnum {
  VIDEO
}

enum BrightcoveAnalyticsReportSortFieldEnum {
  VIDEO_VIEW
}

type BrightcoveAnalyticsReport {
  totalCount: Int!
  nodes: [JSON!]!
  pageInfo: BrightcovePageInfo!
  summary: JSON!
}

input BrightcoveAnalyticsReportQueryInput {
  dimensions: [String!]!
  where: [BrightcoveAnalyticsReportWhere!]!
  fields: [String!] = []
  limit: Int = 10
  offset: Int = 0
  sort: [BrightcoveAnalyticsReportSortInput] = []
  from: Date
  to: Date
  reconciled: Boolean
}

input BrightcoveAnalyticsReportWhere {
  key: BrightcoveAnalyticsReportWhereKeyEnum!
  values: [String!]!
}

input BrightcoveAnalyticsReportSortInput {
  field: BrightcoveAnalyticsReportSortFieldEnum = VIDEO_VIEW
  order: SortOrderEnum = ASC
}

`;
