const { gql } = require('apollo-server-express');

module.exports = gql`

enum ListGAMLineItemSearchFieldEnum {
  NAME
}

enum ListGAMLineItemSortFieldEnum {
  ID
  NAME
}

input ListGAMLineItemsSortInput {
  "The advertiser field to sort by."
  field: ListGAMLineItemSortFieldEnum = ID
  "The sort order."
  order: SortOrderEnum = ASC
}

input ListGAMLineItemsQuerySearchInput {
  "The field to search."
  field: ListGAMLineItemSearchFieldEnum!
  "The search phrase."
  phrase: String!
}

`;
