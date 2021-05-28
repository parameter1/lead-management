const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  extractedHost(id: String): ExtractedHost!

  extractedUrl(input: ModelIdInput!): ExtractedUrl!
  allExtractedUrls(pagination: PaginationInput = {}, sort: ExtractedUrlSortInput = {}): ExtractedUrlConnection!
  searchExtractedUrls(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): ExtractedUrlConnection!

  # allExtractedUrlsForSend(sendId: String!, pagination: PaginationInput = {}, sort: ExtractedUrlSortInput = {}): ExtractedUrlConnection!
  # searchExtractedUrlsForSend(sendId: String!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): ExtractedUrlConnection!

  extractUrlsFromHtml(html: String!): [String]
  generateTrackedHtml(html: String!, useNewTracking: Boolean = false): String!

  crawlUrl(url: String!, cache: Boolean = true): ExtractedUrl!
}

extend type Mutation {
  extractedUrlCustomer(input: ExtractedUrlCustomerInput!): ExtractedUrl!
  extractedUrlTags(input: ExtractedUrlTagsInput!): ExtractedUrl!
  extractedUrlParams(input: ExtractedUrlParamsInput!): ExtractedUrl!
  extractedUrlLinkType(input: ExtractedUrlLinkTypeInput!): ExtractedUrl!
  extractedHostCustomer(input: ExtractedHostCustomerInput!): ExtractedHost!
  extractedHostTags(input: ExtractedHostTagsInput!): ExtractedHost!
  extractedHostParams(input: ExtractedHostParamsInput!): ExtractedHost!
}

type ExtractedUrlConnection {
  totalCount: Int!
  edges: [ExtractedUrlEdge]!
  pageInfo: PageInfo!
}

type ExtractedUrlEdge {
  node: ExtractedUrl!
  cursor: String!
}

input ExtractedUrlSortInput {
  field: String!
  order: Int! = -1
}

input ExtractedUrlCustomerInput {
  urlId: String!
  customerId: String
}
input ExtractedUrlTagsInput {
  urlId: String!
  tagIds: [String!]
}
input ExtractedUrlLinkTypeInput {
  urlId: String!
  type: String!
}
input ExtractedUrlParamsInput {
  urlId: String!
  params: [UrlParameterInput]
}
input ExtractedHostCustomerInput {
  hostId: String!
  customerId: String
}
input ExtractedHostTagsInput {
  hostId: String!
  tagIds: [String!]
}
input ExtractedHostParamsInput {
  hostId: String!
  params: [UrlParameterInput]
}

type ExtractedUrl {
  id: String!
  shortId: String!
  title: String
  lastCrawledDate: Date
  errorMessage: String
  linkType: String
  values: ExtractedUrlValues!
  meta: ExtractedUrlMeta
  host: ExtractedHost!
  customer: Customer
  tags: [Tag]
  urlParams: [UrlParameter]
}

type ExtractedUrlValues {
  original: String!
  resolved: String!
}

type ExtractedUrlMeta {
  description: String
}

type ExtractedHost {
  id: String!
  value: String!
  customer: Customer
  tags: [Tag]
  urlParams: [UrlParameter]
}

type UrlParameter {
  key: String!
  value: String
  isMergeVar: Boolean
  encodedValue: String!
}

input UrlParameterInput {
  key: String!
  value: String
}

`;
