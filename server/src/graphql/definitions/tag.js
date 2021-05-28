const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allTags(pagination: PaginationInput = {}, sort: TagSortInput = {}): TagConnection!
  searchTags(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): TagConnection!
  tag(input: ModelIdInput!): Tag!
}

extend type Mutation {
  createTag(input: CreateTagInput!): Tag!
  updateTag(input: UpdateTagInput!): Tag!
  deleteTag(input: ModelIdInput!): String!
}

type TagConnection {
  totalCount: Int!
  edges: [TagEdge]!
  pageInfo: PageInfo!
}

type TagEdge {
  node: Tag!
  cursor: String!
}

input TagSearchInput {
  typeahead: TagTypeaheadInput!
}

input TagTypeaheadInput {
  field: TagTypeAheadField!
  term: String!
}

input TagSortInput {
  field: TagSortField! = createdAt
  order: Int! = -1
}

input TagPayloadInput {
  name: String!
}

input CreateTagInput {
  payload: TagPayloadInput!
}

input UpdateTagInput {
  id: String!
  payload: TagPayloadInput!
}

enum TagSortField {
  name
  createdAt
  updatedAt
}

enum TagTypeAheadField {
  name
}

type Tag {
  id: String!
  name: String!
  createdAt: Date
  updatedAt: Date
}

`;
