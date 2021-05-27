const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allFormEntries(input: AllFormEntriesInput!, pagination: PaginationInput = {}, sort: FormEntrySortInput = {}): FormEntryConnection!
}

extend type Mutation {
  formEntryActivate(input: ModelIdInput!): FormEntry!
  formEntryDeactivate(input: ModelIdInput!): FormEntry!
}

input AllFormEntriesInput {
  formId: String!
  suppressInactives: Boolean = false
  refresh: Boolean = false
  max: Int
  startDate: Date
  endDate: Date
}

type FormEntryConnection {
  totalCount: Int!
  edges: [FormEntryEdge]!
  pageInfo: PageInfo!
}

type FormEntryEdge {
  node: FormEntry!
  cursor: String!
}

input FormEntrySortInput {
  field: FormEntrySortField = identifier
  order: Int = 1
}

enum FormEntrySortField {
  identifier
}

type FormEntry {
  id: String!
  identifier: Int!
  form: Form!
  inactive: Boolean
  values: JSON # deprecated - use wufooValues instead
  wufooValues: [WufooFormEntryValue]!
  submittedAt: Date!
  createdAt: Date
  updatedAt: Date
}

type WufooFormEntryValue {
  value: String
  field: WufooFormField!
}

`;
