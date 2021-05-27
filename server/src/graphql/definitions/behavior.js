const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allContentQueryResults(queryId: String!, pagination: PaginationInput = {}, sort: ContentQueryResultSortInput = {}): ContentQueryResultConnection!
  searchContentQueryResults(queryId: String!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): ContentQueryResultConnection!
  allContentQueryResultRows(resultId: String!, pagination: PaginationInput = {}, sort: IdentitySortInput = {}): ContentQueryResultRowConnection!
  contentQueryResult(input: ModelIdInput!): ContentQueryResult!
}

extend type Mutation {
  createContentQueryResult(input: CreateContentQueryResultInput!): ContentQueryResult!
}

type ContentQueryResult {
  id: String!
  startDate: Date!
  endDate: Date!
  contentCount: Int!
  identityCount: Int!
  ranBy: User
  ranAt: Date
  # exports: [ContentQueryExport]
}

type ContentQueryResultConnection {
  totalCount: Int!
  edges: [ContentQueryResultEdge]!
  pageInfo: PageInfo!
}

type ContentQueryResultEdge {
  node: ContentQueryResult!
  cursor: String!
}

input ContentQueryResultSortInput {
  field: ContentQueryResultSortField! = createdAt
  order: Int! = -1
}

enum ContentQueryResultSortField {
  createdAt
  ranAt
}

input CreateContentQueryResultInput {
  queryId: String!
  startDate: Date!
  endDate: Date!
  contentIds: [Int!]!
}


type ContentQueryResultRowConnection {
  totalCount: Int!
  edges: [ContentQueryResultRowEdge]!
  pageInfo: PageInfo!
}

type ContentQueryResultRowEdge {
  node: Identity!
  cursor: String!
}

`;
