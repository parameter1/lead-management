const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  excludedEmailDomain(input: ModelIdInput!): ExcludedEmailDomain!
  allExcludedEmailDomains(pagination: PaginationInput = {}, sort: ExcludedEmailDomainSortInput = {}): ExcludedEmailDomainConnection!
}

extend type Mutation {
  createExcludedEmailDomain(input: CreateExcludedEmailDomainInput!): ExcludedEmailDomain!
  deleteExcludedEmailDomain(input: ModelIdInput!): String!
}

type ExcludedEmailDomain {
  id: String!
  domain: String!
}

type ExcludedEmailDomainConnection {
  totalCount: Int!
  edges: [ExcludedEmailDomainEdge]!
  pageInfo: PageInfo!
}

type ExcludedEmailDomainEdge {
  node: ExcludedEmailDomain!
  cursor: String!
}

input CreateExcludedEmailDomainInput {
  domain: String!
}

input ExcludedEmailDomainSortInput {
  field: String = id
  order: Int = 1
}

`;
