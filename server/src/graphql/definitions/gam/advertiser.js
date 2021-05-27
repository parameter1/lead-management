const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  listGAMAdvertisers(input: ListGAMAdvertisersQueryInput = {}): GAM_CompanyConnection!
}

extend type Mutation {
  unlinkGAMAdvertiser(input: UnlinkGAMAdvertiserMutationInput!): GAMCompany!
}

extend type GAMCompany {
  customer: Customer
}

enum ListGAMAdvertiserSearchFieldEnum {
  NAME
}

enum ListGAMAdvertiserSortFieldEnum {
  ID
  NAME
  LAST_MODIFIED_DATE_TIME
}

input ListGAMAdvertisersQueryInput {
  limit: Int = 20
  offset: Int = 0
  search: ListGAMAdvertisersQuerySearchInput
  sort: ListGAMAdvertisersSortInput = {}
}

input ListGAMAdvertisersSortInput {
  "The advertiser field to sort by."
  field: ListGAMAdvertiserSortFieldEnum = ID
  "The sort order."
  order: SortOrderEnum = ASC
}

input ListGAMAdvertisersQuerySearchInput {
  "The field to search."
  field: ListGAMAdvertiserSearchFieldEnum!
  "The search phrase."
  phrase: String!
}

input UnlinkGAMAdvertiserMutationInput {
  "The GAM advertiser to unlink."
  advertiserId: String!
}

`;
