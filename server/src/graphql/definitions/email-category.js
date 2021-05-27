const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allEmailCategories(pagination: PaginationInput = {}, sort: EmailCategorySortInput = {}): EmailCategoryConnection!
  searchEmailCategories(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailCategoryConnection!
  emailCategory(input: ModelIdInput!): EmailCategory!
}

extend type Mutation {
  rollupEmailCatgoryMetrics(categoryId: String!, rollupMetrics: Boolean!, isNewsletter: Boolean = false): EmailCategory!
}

type EmailCategoryConnection {
  totalCount: Int!
  edges: [EmailCategoryEdge]!
  pageInfo: PageInfo!
}

type EmailCategoryEdge {
  node: EmailCategory!
  cursor: String!
}

input EmailCategorySortInput {
  field: EmailCategorySortField! = createdAt
  order: Int! = -1
}

enum EmailCategorySortField {
  fullName
  createdAt
  updatedAt
}

type EmailCategory {
  id: String!
  name: String!
  fullName: String!
  hasDeployments: Boolean!
  rollupMetrics: Boolean!
  isNewsletter: Boolean
  parent: EmailCategory
  externalSource: ExternalSource
  createdAt: Date
  updatedAt: Date
}

`;
