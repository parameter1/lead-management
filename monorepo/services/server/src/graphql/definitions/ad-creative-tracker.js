const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allAdCreativeTrackers(pagination: PaginationInput = {}, sort: AdCreativeTrackerSortInput = {}): AdCreativeTrackerConnection!
  searchAdCreativeTrackers(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): AdCreativeTrackerConnection!
  adCreativeTracker(input: ModelIdInput!): AdCreativeTracker!
}

extend type Mutation {
  createAdCreativeTracker(input: CreateAdCreativeTrackerInput!): AdCreativeTracker!
  updateAdCreativeTracker(input: UpdateAdCreativeTrackerInput!): AdCreativeTracker!
  deleteAdCreativeTracker(input: ModelIdInput!): String!
}

type AdCreativeTrackerConnection {
  totalCount: Int!
  edges: [AdCreativeTrackerEdge]!
  pageInfo: PageInfo!
}

type AdCreativeTrackerEdge {
  node: AdCreativeTracker!
  cursor: String!
}

input AdCreativeTrackerSortInput {
  field: AdCreativeTrackerSortField! = createdAt
  order: Int! = -1
}

input AdCreativeTrackerPayloadInput {
  url: String!
  customerId: String!
  description: String
  tagIds: [String!]
}

input CreateAdCreativeTrackerInput {
  payload: AdCreativeTrackerPayloadInput!
}

input UpdateAdCreativeTrackerInput {
  id: String!
  payload: AdCreativeTrackerPayloadInput!
}

enum AdCreativeTrackerSortField {
  createdAt
  updatedAt
}

type AdCreativeTracker {
  id: String!
  url: String!
  description: String
  customer: Customer!
  tags: [Tag]
  trackers: AdCreativeTrackerTrackers!
  createdAt: Date
  updatedAt: Date
}

type AdCreativeTrackerTrackers {
  click: String!
  impression: String!
}

`;
