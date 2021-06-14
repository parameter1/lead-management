const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  brightcoveCMSVideo(input: BrightcoveCMSVideoQueryInput!): BrightcoveCMSVideo!
  brightcoveCMSVideos(input: BrightcoveCMSVideosQueryInput!): BrightcoveCMSVideoConnection!
}

enum BrightcoveCMSVideoSearchFieldEnum {
  NAME
}

enum BrightcoveCMSVideoSortFieldEnum {
  CREATED_AT
  NAME
  PUBLISHED_AT
  UPDATED_AT
}

enum BrightcoveCMSVideoSortFieldEnum {
  CREATED_AT
  NAME
  PUBLISHED_AT
  UPDATED_AT
}

type BrightcoveCMSVideo {
  id: String!
  name: String!
  description: String
  longDescription: String @apiValue(path: "long_description")
  state: String!
  originalFilename: String! @apiValue(path: "original_filename")
  duration: Int!
  images(input: BrightcoveCMSVideoImagesInput = {}): [BrightcoveCMSVideoImage!]!
  createdAt: Date! @apiValue(path: "created_at")
  publishedAt: Date @apiValue(path: "published_at")
  updatedAt: Date! @apiValue(path: "updated_at")
}

extend type BrightcoveCMSVideo {
  customers: [Customer!]!
}

type BrightcoveCMSVideoImage {
  type: String!
  src: String!
  sources: [BrightcoveCMSVideoImageSource!]!
}

type BrightcoveCMSVideoImageSource {
  src: String!
  height: Int!
  width: Int!
}

type BrightcoveCMSVideoConnection {
  totalCount: Int!
  nodes: [BrightcoveCMSVideo!]!
  pageInfo: BrightcovePageInfo!
}

input BrightcoveCMSVideoImagesInput {
  type: String
}

input BrightcoveCMSVideoSearchInput {
  field: BrightcoveCMSVideoSearchFieldEnum!
  phrase: String!
}

input BrightcoveCMSVideoSortInput {
  field: BrightcoveCMSVideoSortFieldEnum = CREATED_AT
  order: SortOrderEnum = ASC
}

input BrightcoveCMSVideoQueryInput {
  id: String!
}

input BrightcoveCMSVideosQueryInput {
  limit: Int = 20
  offset: Int = 0
  sort: BrightcoveCMSVideoSortInput = {}
  search: BrightcoveCMSVideoSearchInput
  query: String
}

`;
