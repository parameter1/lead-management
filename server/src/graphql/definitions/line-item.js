const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  lineItem(input: ModelIdInput!): LineItem!
  allLineItems(input: AllLineItemsInput = {}, pagination: PaginationInput = {}, sort: LineItemSortInput = {}): LineItemConnection!
  searchLineItems(input: SearchLineItemsInput!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): LineItemConnection!
  allLineItemsForOrder(input: AllLineItemsForOrderInput!, pagination: PaginationInput = {}, sort: LineItemSortInput = {}): LineItemConnection!
  searchLineItemsForOrder(input: SearchLineItemsForOrderInput!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): LineItemConnection!

  emailLineItem(input: ModelIdInput!): EmailLineItem!

  lineItemByHash(input: LineItemByHashInput!): LineItem!

  emailLineItemActiveIdentities(input: ModelIdInput!, pagination: PaginationInput = {}, sort: IdentitySortInput = {}): EmailLineItemIdentityConnection!
  searchEmailLineItemActiveIdentities(input: ModelIdInput!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailLineItemIdentityConnection!

  emailLineItemInactiveIdentities(input: ModelIdInput!, pagination: PaginationInput = {}, sort: IdentitySortInput = {}): EmailLineItemIdentityConnection!
  searchEmailLineItemInactiveIdentities(input: ModelIdInput!, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailLineItemIdentityConnection!

  formLineItem(input: ModelIdInput!): FormLineItem!
  # must be public - reports use this
  # formLineItemLeads(input: FormLineItemLeadsQueryInput!, pagination: PaginationInput = {}, sort: FormEntrySortInput = {}): FormLineItemLeadConnection!
}

extend type Mutation {
  createEmailLineItem(input: CreateEmailLineItemInput!): EmailLineItem!
  # @todo Note: these individual field mutations could be a directive.
  emailLineItemExcludedFields(input: EmailLineItemExcludedFieldsInput!): EmailLineItem!
  emailLineItemRequiredFields(input: EmailLineItemRequiredFieldsInput!): EmailLineItem!
  emailLineItemIdentityFilters(input: EmailLineItemIdentityFiltersInput!): EmailLineItem!
  emailLineItemTags(input: EmailLineItemTagsInput): EmailLineItem!
  emailLineItemExcludedTags(input: EmailLineItemExcludedTagsInput): EmailLineItem!
  emailLineItemLinkTypes(input: EmailLineItemLinkTypesInput): EmailLineItem!
  emailLineItemCategories(input: EmailLineItemCategoriesInput): EmailLineItem!
  emailLineItemExcludedUrls(input: EmailLineItemExcludedUrlsInput): EmailLineItem!

  # generic actions
  lineItemDateRange(input: LineItemDateRangeInput): LineItem!
  lineItemName(input: LineItemNameInput): LineItem!
  lineItemNotes(input: LineItemNotesInput): LineItem!
  lineItemRequiredLeads(input: LineItemRequiredLeadsInput): LineItem!
  lineItemTotalValue(input: LineItemTotalValueInput): LineItem!
  lineItemArchived(input: LineItemArchivedInput): LineItem!

  # form actions
  formLineItemChoiceFilters(input: FormLineItemChoiceFiltersInput!): FormLineItem!

  createFormLineItem(input: CreateFormLineItemInput!): FormLineItem!
}

interface LineItem {
  id: String!
  hash: String!
  type: String!
  typeFormatted: String!
  name: String!
  order: Order!
  notes: String
  deleted: Boolean!
  range: LineItemDateRange
  createdAt: Date
  updatedAt: Date
  archived: Boolean!
  status: LineItemStatus!
  requiredLeads: Int!
  totalValue: Float!
  cpl: Float!
  progress: LineItemProgress!
}

type EmailLineItem implements LineItem {
  id: String!
  hash: String!
  type: String!
  typeFormatted: String!
  name: String!
  order: Order!
  notes: String
  deleted: Boolean!
  range: LineItemDateRange
  createdAt: Date
  updatedAt: Date
  archived: Boolean!
  status: LineItemStatus!
  requiredLeads: Int!
  totalValue: Float!
  cpl: Float!
  progress: LineItemProgress!

  urlGroups: [EmailLineItemUrlGroup]

  requiredFields: [String]
  excludedFields: [String]
  excludedUrls: [EmailLineItemExcludedUrl]
  linkTypes: [String]
  identityFilters: [LineItemIdentityFilter]
  tags: [Tag]
  excludedTags: [Tag]
  categories: [EmailCategory]
}

type FormLineItem implements LineItem {
  id: String!
  hash: String!
  type: String!
  typeFormatted: String!
  name: String!
  order: Order!
  notes: String
  deleted: Boolean!
  range: LineItemDateRange
  createdAt: Date
  updatedAt: Date
  archived: Boolean!
  status: LineItemStatus!
  requiredLeads: Int!
  totalValue: Float!
  cpl: Float!
  progress: LineItemProgress!

  form: Form!

  choiceFilters: [FormLineItemChoiceFilter]
}

type LineItemProgress {
  qualified: LineItemQualified!
  scrubbed: LineItemScrubbed!
  pacing: LineItemPacing!
}

type LineItemPacing {
  totalDays: Int!
  requiredLeadsPerDay: Float!
  daysElapsed: Int!
  currentLeadsPerDay: Float!
  pacingRate: Float!
  leadsShouldBeAt: Float!
  leadsShouldBeAtPct: Float!
  leadsCurrentlyAt: Float!
  leadsCurrentlyAtPct: Float!
}

type LineItemQualified {
  total: Int!
  rate: Float!
}

type LineItemScrubbed {
  total: Int!
  rate: Float!
}

type EmailLineItemExcludedUrl {
  id: String!
  url: ExtractedUrl!
  send: EmailSend!
}

type EmailLineItemUrlGroup {
  id: String!
  url: ExtractedUrl!
  deploymentGroups: [EmailLineItemUrlDeploymentGroup!]
}

type EmailLineItemUrlDeploymentGroup {
  deployment: EmailDeployment!
  sendGroups: [EmailLineItemUrlSendGroup]
}

type EmailLineItemUrlSendGroup {
  id: String
  send: EmailSend!
  active: Boolean
}

enum LineItemStatus {
  Active
  Pending
  Completed
}

type LineItemIdentityFilter {
  id: String!
  key: String
  label: String
  matchType: String
  terms: [String]
}

type FormLineItemChoiceFilter {
  id: String!
  fieldId: String
  title: String
  choices: [String]
}

type LineItemConnection {
  totalCount: Int!
  edges: [LineItemEdge]!
  pageInfo: PageInfo!
}

type LineItemEdge {
  node: LineItem!
  cursor: String!
}

type EmailLineItemIdentityConnection {
  totalCount: Int!
  edges: [EmailLineItemIdentityEdge]!
  pageInfo: PageInfo!
}

type EmailLineItemIdentityEdge {
  node: Identity
  cursor: String!
}

type LineItemDateRange {
  start: Date
  end: Date
}

type FormLineItemLeadConnection {
  totalCount: Int!
  edges: [FormLineItemLeadEdge]!
  pageInfo: PageInfo!
}

type FormLineItemLeadEdge {
  node: FormEntry
  cursor: String!
}

enum LineItemTypeEnum {
  EMAIL
  FORM
}

enum LineItemDashboardStatus {
  active
  fulfilled
  completed # deprecated
  archived
  all
}

enum LineItemSortField {
  type
  name
  createdAt
  updatedAt
}

input LineItemByHashInput {
  hash: String!
}

input LineItemDateFilterInput {
  before: Date
  after: Date
}

input AllLineItemsInput {
  since: Date
  dashboardStatus: LineItemDashboardStatus = active

  customerIds: [ObjectID!] = []
  salesRepIds: [ObjectID!] = []
  types: [LineItemTypeEnum!] = []
  starting: LineItemDateFilterInput = {}
  ending: LineItemDateFilterInput = {}
}

input AllLineItemsForOrderInput {
  orderId: String!
}

input FormLineItemLeadsQueryInput {
  id: String
  hash: String
  active: Boolean = true
  refresh: Boolean = false
}

input SearchLineItemsForOrderInput {
  orderId: String!
}

input SearchLineItemsInput {
  since: Date
  dashboardStatus: LineItemDashboardStatus = active

  customerIds: [ObjectID!] = []
  salesRepIds: [ObjectID!] = []
  types: [LineItemTypeEnum!] = []
  starting: LineItemDateFilterInput = {}
  ending: LineItemDateFilterInput = {}
}

input CreateEmailLineItemInput {
  name: String!
  orderId: String!
  requiredLeads: Int!
  totalValue: Float!
  range: LineItemRangeInput!
  excludedFields: [String]
  requiredFields: [String]
  linkTypes: [String]
  tagIds: [String]
  categoryIds: [String]
  identityFilters: [LineItemIdentityFilterInput]
  notes: String
}

input CreateFormLineItemInput {
  name: String!
  orderId: String!
  requiredLeads: Int!
  totalValue: Float!
  range: LineItemRangeInput!
  notes: String
  formId: String!
}

input LineItemIdentityFilterInput {
  key: String!
  label: String!
  matchType: String!
  terms: [String!]!
}

input FormLineItemChoiceFilterInput {
  fieldId: String!
  title: String!
  choices: [String!]!
}


input LineItemRangeInput {
  start: Date!
  end: Date!
}

input LineItemNameInput {
  id: String!
  name: String!
}

# deprecated
input EmailLineItemNameInput {
  id: String!
  name: String!
}

input LineItemNotesInput {
  id: String!
  notes: String
}

# deprecated
input EmailLineItemNotesInput {
  id: String!
  notes: String
}

input LineItemRequiredLeadsInput {
  id: String!
  requiredLeads: Int!
}

# deprecated
input EmailLineItemRequiredLeadsInput {
  id: String!
  requiredLeads: Int!
}

input LineItemTotalValueInput {
  id: String!
  totalValue: Float!
}

# deprecated
input EmailLineItemTotalValueInput {
  id: String!
  totalValue: Float!
}

input LineItemDateRangeInput {
  id: String!
  range: LineItemRangeInput!
}

# deprecated
input EmailLineItemDateRangeInput {
  id: String!
  range: LineItemRangeInput!
}

input EmailLineItemExcludedFieldsInput {
  id: String!
  excludedFields: [String!]!
}

input EmailLineItemRequiredFieldsInput {
  id: String!
  requiredFields: [String!]!
}

input EmailLineItemIdentityFiltersInput {
  id: String!
  filters: [LineItemIdentityFilterInput!]!
}

input FormLineItemChoiceFiltersInput {
  id: String!
  filters: [FormLineItemChoiceFilterInput!]!
}

input EmailLineItemTagsInput {
  id: String!
  tagIds: [String!]!
}

input EmailLineItemExcludedTagsInput {
  id: String!
  tagIds: [String!]!
}

input EmailLineItemLinkTypesInput {
  id: String!
  linkTypes: [String!]!
}

input EmailLineItemCategoriesInput {
  id: String!
  categoryIds: [String!]!
}

input EmailLineItemExcludedUrlsInput {
  id: String!
  excludedUrls: [EmailLineItemExcludedUrlInput!]!
}

input LineItemArchivedInput {
  id: String!
  archived: Boolean!
}

# deprecated
input EmailLineItemArchivedInput {
  id: String!
  archived: Boolean!
}

input EmailLineItemExcludedUrlInput {
  urlId: String!
  sendId: String!
  active: Boolean!
}

input LineItemSortInput {
  field: LineItemSortField! = createdAt
  order: Int! = -1
}

`;
