const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allVideos(pagination: PaginationInput = {}, sort: VideoSortInput = {}): VideoConnection!
  searchVideos(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): VideoConnection!
  video(input: ModelIdInput!): Video!
}

extend type Mutation {
  videoCustomer(input: VideoCustomerInput!): Video!
}

type VideoConnection {
  totalCount: Int!
  edges: [VideoEdge]!
  pageInfo: PageInfo!
}

type VideoEdge {
  node: Video!
  cursor: String!
}

input VideoSortInput {
  field: String! = "externalSource.createdAt"
  order: Int! = -1
}

type Video {
  id: String!
  externalSource: ExternalSource!
  customer: Customer
  name: String!
  description: String
  body: String
  duration: Int
  publishedAt: Date
  image: String
  thumbnail: String
  tags: [String]
  state: String
}

input VideoCustomerInput {
  videoId: String!
  customerId: String
}

`;
