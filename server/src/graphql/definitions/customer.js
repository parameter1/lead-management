const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allCustomers(pagination: PaginationInput = {}, sort: CustomerSortInput = {}): CustomerConnection!
  searchCustomers(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): CustomerConnection!
  customer(input: ModelIdInput!): Customer!
  customerBrightcoveVideos(input: CustomerBrightcoveVideosQueryInput!): BrightcoveCMSVideoConnection!
}

extend type Mutation {
  createCustomer(input: CreateCustomerInput!): Customer!
  linkGAMAdvertiserToCustomer(input: LinkGAMAdvertiserToCustomerMutationInput!): Customer!
  linkBrightcoveVideoToCustomers(input: LinkBrightcoveVideoToCustomersMutationInput!): Boolean!
  updateCustomer(input: UpdateCustomerInput!): Customer!
  deleteCustomer(input: ModelIdInput!): String!
}

type CustomerConnection {
  totalCount: Int!
  edges: [CustomerEdge]!
  pageInfo: PageInfo!
}

type CustomerEdge {
  node: Customer!
  cursor: String!
}

input CustomerSortInput {
  field: CustomerSortField! = createdAt
  order: Int! = -1
}

input CustomerPayloadInput {
  name: String!
  website: String
  parentId: String
  description: String
  gamAdvertiserIds: [String!] = []
}

input CreateCustomerInput {
  payload: CustomerPayloadInput!
}

input UpdateCustomerInput {
  id: String!
  payload: CustomerPayloadInput!
}

input LinkGAMAdvertiserToCustomerMutationInput {
  "The customer to link the GAM advertiser to."
  customerId: String!
  "The GAM advertiser to link."
  advertiserId: String!
}

input LinkBrightcoveVideoToCustomersMutationInput {
  "The customer(s) to link the video to. An empty array of customer IDs will unlink the video from all customers."
  customerIds: [String!]
  "The video to link."
  videoId: String!
}

input CustomerBrightcoveVideosQueryInput {
  customerId: String!
  limit: Int = 20
  offset: Int = 0
  sort: BrightcoveCMSVideoSortInput = {}
  search: BrightcoveCMSVideoSearchInput
}

enum CustomerSortField {
  name
  createdAt
  updatedAt
}

enum CustomerTypeAheadField {
  name
}

type Customer {
  id: String!
  name: String!
  key: String!
  hash: String!
  description: String
  website: String
  deleted: Boolean!
  createdAt: Date
  updatedAt: Date
  parent: Customer
  children: [Customer]!
  externalSource: ExternalSource
  linkedAdvertisers: CustomerLinkedAdvertisers!
  linkedVideos: CustomerLinkedVideos!
}

type CustomerLinkedAdvertisers {
  googleAdManager: GAM_CompanyConnection!
}

type CustomerLinkedVideos {
  brightcove(input: CustomerLinkVideosBrightcoveInput = {}): BrightcoveCMSVideoConnection!
}

input CustomerLinkVideosBrightcoveInput {
  limit: Int = 20
  offset: Int = 0
  sort: BrightcoveCMSVideoSortInput = {}
  search: BrightcoveCMSVideoSearchInput
}

`;
