const { gql } = require('apollo-server-express');

module.exports = gql`

directive @apiValue(path: String, as: ApiValueDirectiveAsEnum) on FIELD_DEFINITION

scalar Date
scalar JSON
scalar ObjectID

enum ApiValueDirectiveAsEnum {
  ARRAY
  OBJECT
}

enum SortOrderEnum {
  ASC
  DESC
}

type Query {
  ping: String!
}

type Mutation {
  ping: String!
}

type ExternalSource {
  identifier: String
  namespace: String
  lastRetrievedAt: Date
  createdAt: Date
  updatedAt: Date
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

input ExternalSourceInput {
  identifier: String!
  namespace: String!
}

input ModelIdInput {
  id: String!
}

input PaginationInput {
  first: Int! = 25
  after: String
}

input TypeAheadInput {
  field: String!
  phrase: String!
}

input TypeAheadOptionsInput {
  position: String!
}

`;
