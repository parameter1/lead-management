const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allForms(input: AllFormsQueryInput = {}, pagination: PaginationInput = {}, sort: FormSortInput = {}): FormConnection!
  searchForms(pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): FormConnection!
  form(input: FormInput!): Form!
}

extend type Mutation {
  createForm(input: CreateFormInput!): Form!
  updateForm(input: UpdateFormInput!): Form!
  deleteForm(input: ModelIdInput!): String!
}

type FormConnection {
  totalCount: Int!
  edges: [FormEdge]!
  pageInfo: PageInfo!
}

type FormEdge {
  node: Form!
  cursor: String!
}

input FormInput {
  id: String!
  refreshEntries: Boolean = false
}

input FormEntriesInput {
  suppressInactives: Boolean = false
  refresh: Boolean = false
  max: Int
  startDate: Date
  endDate: Date
}

input FormSortInput {
  field: String! = createdAt
  order: Int! = -1
}

input FormPayloadInput {
  customerId: String
  externalSource: ExternalSourceInput!
}

input CreateFormInput {
  payload: FormPayloadInput!
}

input UpdateFormInput {
  id: String!
  payload: FormPayloadInput!
}

type Form {
  id: String!
  isNew: Boolean!
  name: String
  description: String
  customer: Customer
  previewUrl: String
  deleted: Boolean!
  fields: JSON # deprecated. use wufoo fields instead
  wufooFields(input: FormWufooFieldsInput = {}): [WufooFormField]
  createdAt: Date
  updatedAt: Date
  externalSource: ExternalSource
  entries(input: FormEntriesInput = {}, pagination: PaginationInput = {}, sort: FormEntrySortInput = {}): FormEntryConnection!
}

type WufooSubField {
  id: String!
  label: String
  default: String
}

interface WufooFormField {
  id: String!
  title: String
}

interface WufooChoicesField {
  choices: [String]!
}

interface WufooSubFieldField {
  subFields: [WufooSubField]!
}

type WufooAddressField implements WufooFormField & WufooSubFieldField {
  id: String!
  title: String
  subFields: [WufooSubField]!
}

type WufooCheckboxField implements WufooFormField & WufooChoicesField & WufooSubFieldField {
  id: String!
  title: String
  choices: [String]!
  subFields: [WufooSubField]!
}

type WufooDateField implements WufooFormField {
  id: String!
  title: String
}

type WufooEmailField implements WufooFormField {
  id: String!
  title: String
}

type WufooFileField implements WufooFormField {
  id: String!
  title: String
}

type WufooLikertField implements WufooFormField {
  id: String!
  title: String
}

type WufooMoneyField implements WufooFormField {
  id: String!
  title: String
}

type WufooNumberField implements WufooFormField {
  id: String!
  title: String
}

type WufooPhoneField implements WufooFormField {
  id: String!
  title: String
}

type WufooRadioField implements WufooFormField & WufooChoicesField {
  id: String!
  title: String
  choices: [String]!
}

type WufooRatingField implements WufooFormField {
  id: String!
  title: String
}

type WufooSelectField implements WufooFormField & WufooChoicesField {
  id: String!
  title: String
  choices: [String]!
}

type WufooShortnameField implements WufooFormField & WufooSubFieldField {
  id: String!
  title: String
  subFields: [WufooSubField]!
}

type WufooTextField implements WufooFormField {
  id: String!
  title: String
}

type WufooTextareaField implements WufooFormField {
  id: String!
  title: String
}

type WufooTimeField implements WufooFormField {
  id: String!
  title: String
}

type WufooUrlField implements WufooFormField {
  id: String!
  title: String
}

input AllFormsQueryInput {
  customerIds: [String!] = []
}

input FormWufooFieldsInput {
  refresh: Boolean = false
  choicesOnly: Boolean = false
}

`;
