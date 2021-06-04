const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  identity(input: ModelIdInput!): Identity!
  allIdentities(pagination: PaginationInput = {}, sort: IdentitySortInput = {}): IdentityConnection!
  searchIdentities(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): IdentityConnection!
}

extend type Mutation {
  identityActivation(input: IdentityActivation!): Identity!
  identityCustomerActivation(input: IdentityCustomerActivation!): Identity!
  identityCampaignActivation(input: IdentityCampaignActivation!): Identity!
  identityLineItemActivation(input: IdentityLineItemActivation!): Identity!
}

type Identity {
  id: String!
  givenName: String
  familyName: String
  title: String
  companyName: String
  fieldCount: Int
  emailAddress: String
  emailDomain: String
  phoneNumber: String
  street: String
  streetExtra: String
  city: String
  region: String
  postalCode: String
  country: String
  attributes: JSON
  externalSource: ExternalSource
  inactive: Boolean!
  domainExcluded: Boolean
  lastRetrievedAt: Date
  createdAt: Date
  updatedAt: Date
  inactiveCustomers: [Customer]
  inactiveCampaigns: [Campaign]
  inactiveLineItems: [LineItem]
}

type IdentityConnection {
  totalCount: Int!
  edges: [IdentityEdge]!
  pageInfo: PageInfo!
}

type IdentityEdge {
  node: Identity!
  cursor: String!
}

input IdentityActivation {
  identityId: String!
  active: Boolean!
}

input IdentityCustomerActivation {
  identityId: String!
  customerId: String!
  active: Boolean!
}

input IdentityCampaignActivation {
  identityId: String!
  campaignId: String!
  active: Boolean!
}

input IdentityLineItemActivation {
  identityId: String!
  lineItemId: String!
  active: Boolean!
}

input IdentitySortInput {
  field: String! = emailAddress
  order: Int! = 1
}

`;
