const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  allCampaigns(input: AllCampaignsQueryInput = {}, pagination: PaginationInput = {}, sort: CampaignSortInput = {}): CampaignConnection!
  searchCampaigns(input: SearchCampaignsQueryInput = {}, pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): CampaignConnection!
  campaign(input: ModelIdInput!): Campaign!
  campaignByHash(hash: String!): Campaign!
  emailCampaign(input: ModelIdInput!): EmailCampaign!
  adCampaign(input: ModelIdInput!): AdCampaign!
  formCampaign(input: ModelIdInput!): FormCampaign!

  emailCampaignIdentities(id: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): EmailCampaignIdentityConnection!
  searchEmailCampaignIdentities(id: String! pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): EmailCampaignIdentityConnection!

  adCampaignIdentities(id: String! pagination: PaginationInput = {}, sort: IdentitySortInput = {}): AdCampaignIdentityConnection!
  searchAdCampaignIdentities(id: String! pagination: PaginationInput = {}, search: TypeAheadInput!, options: TypeAheadOptionsInput): AdCampaignIdentityConnection!
}

extend type Mutation {
  createCampaign(input: CreateCampaignInput!): Campaign!
  updateCampaign(input: UpdateCampaignInput!): Campaign!
  cloneCampaign(input: ModelIdInput!): Campaign!
  deleteCampaign(input: ModelIdInput!): String!

  emailCampaignTags(input: EmailCampaignTagsInput!): EmailCampaign!
  emailCampaignExcludedTags(input: EmailCampaignExcludedTagsInput!): EmailCampaign!
  emailCampaignLinkTypes(input: EmailCampaignLinkTypesInput!): EmailCampaign!
  emailCampaignExcludedFields(input: EmailCampaignExcludedFieldsInput!): EmailCampaign!
  emailCampaignIdentityFilters(input: EmailCampaignIdentityFiltersInput!): EmailCampaign!
  emailCampaignExcludedUrls(input: EmailCampaignExcludedUrlsInput): EmailCampaign!
  emailCampaignStatus(input: CampaignStatusInput!): EmailCampaign!
  emailCampaignRestrictSentDate(input: CampaignRestrictSentDateInput!): EmailCampaign!
  emailCampaignDisplayDeliveredMetrics(input: CampaignDisplayDeliveredMetricsInput!): EmailCampaign!

  formCampaignStatus(input: CampaignStatusInput!): FormCampaign!
  formCampaignExcludedForms(input: FormCampaignExcludedFormsInput): FormCampaign!

  adCampaignStatus(input: CampaignStatusInput!): AdCampaign!
  adCampaignTags(input: AdCampaignTagsInput!): AdCampaign!
  adCampaignExcludedFields(input: AdCampaignExcludedFieldsInput!): AdCampaign!
  adCampaignIdentityFilters(input: AdCampaignIdentityFiltersInput!): AdCampaign!
  adCampaignExcludedTrackers(input: AdCampaignExcludedTrackersInput): AdCampaign!

  adMetricsCampaignStatus(input: CampaignStatusInput!): Campaign!
  adMetricsExcludedGAMLineItemIds(input: AdMetricsExcludedGAMLineItemIdsMutationInput!): Campaign!

  videoMetricsCampaignStatus(input: CampaignStatusInput!): Campaign!
  videoMetricsExcludedBrightcoveVideoIds(input: VideoMetricsExcludedBrightcoveVideoIdsMutationInput!): Campaign!
}

type Campaign {
  id: String!
  hash: String!
  name: String
  fullName: String!
  customer: Customer!
  startDate: Date
  endDate: Date
  maxIdentities: Int
  email: EmailCampaign
  forms: FormCampaign
  ads: AdCampaign
  adMetrics: CampaignAdMetrics
  videoMetrics: CampaignVideoMetrics
  deleted: Boolean!
  createdAt: Date
  updatedAt: Date

  gamLineItems(input: CampaignGAMLineItemsInput = {}): GAM_LineItemConnection!
  gamLineItemReport: JSON

  brightcoveVideoReport: BrightcoveAnalyticsReport!
}

type CampaignAdMetrics {
  id: String!
  enabled: Boolean!
  excludedGAMLineItemIds: [String!]!
}

type CampaignVideoMetrics {
  id: String!
  enabled: Boolean!
  excludedBrightcoveVideoIds: [String!]!
}

type EmailCampaignUrl {
  id: String!
  deployment: EmailDeployment!
  send: EmailSend!
  url: ExtractedUrl!
  active: Boolean
}

type FormCampaign {
  id: String!
  enabled: Boolean!
  forms(refreshEntries: Boolean!): [FormCampaignForm!]!
}

type FormCampaignForm {
  id: String!
  form: Form!
  active: Boolean
}

type AdCampaign {
  id: String!
  enabled: Boolean!
  tags: [Tag]
  excludeFields: [String]
  identityFilters: [CampaignIdentityFilter]
  trackers: [AdCreativeTracker]
  excludeTrackers: [AdCreativeTracker]
  "Whether this ad campaign has any identity/lead data."
  hasIdentities: Boolean!
}

type EmailCampaign {
  id: String!
  enabled: Boolean!
  tags: [Tag]
  excludedTags: [Tag]
  excludeFields: [String]
  allowedLinkTypes: [String]
  identityFilters: [CampaignIdentityFilter]
  excludeUrls: [EmailCampaignExcludedUrl]
  restrictToSentDate: Boolean
  displayDeliveredMetrics: Boolean
  urls: [EmailCampaignUrl]
  urlCount: Int
  urlGroups: [EmailCampaignUrlGroup]
  "Whether this email campaign has any eligible send/deployment data."
  hasEmailSends: Boolean!
}

type EmailCampaignExcludedUrl {
  id: String!
  url: ExtractedUrl!
  send: EmailSend!
}

type EmailCampaignUrlGroup {
  id: String!
  url: ExtractedUrl!
  deploymentGroups: [EmailCampaignUrlDeploymentGroup!]
},

type EmailCampaignUrlDeploymentGroup {
  deployment: EmailDeployment!
  sendGroups: [EmailCampaignUrlSendGroup]
}

type EmailCampaignUrlSendGroup {
  id: String
  send: EmailSend!
  active: Boolean
}

type CampaignIdentityFilter {
  id: String!
  key: String
  label: String
  matchType: String
  terms: [String]
}

type CampaignConnection {
  totalCount: Int!
  edges: [CampaignEdge]!
  pageInfo: PageInfo!
}

type EmailCampaignIdentityConnection {
  totalCount: Int!
  edges: [EmailCampaignIdentityEdge]!
  pageInfo: PageInfo!
}

type AdCampaignIdentityConnection {
  totalCount: Int!
  edges: [AdCampaignIdentityEdge]!
  pageInfo: PageInfo!
}

type CampaignEdge {
  node: Campaign!
  cursor: String!
}

type EmailCampaignIdentityEdge {
  node: Identity
  cursor: String!
}

type AdCampaignIdentityEdge {
  node: Identity
  cursor: String!
}

input AdMetricsExcludedGAMLineItemIdsMutationInput {
  id: String!
  excludedIds: [String!]!
}

input VideoMetricsExcludedBrightcoveVideoIdsMutationInput {
  id: String!
  excludedIds: [String!]!
}

input CampaignGAMLineItemsInput {
  limit: Int = 20
  offset: Int = 0
  search: ListGAMLineItemsQuerySearchInput
  sort: ListGAMLineItemsSortInput = {}
}

input CampaignBrightcoveVideosInput {
  limit: Int = 20
  offset: Int = 0
  sort: BrightcoveCMSVideoSortInput = {}
  search: BrightcoveCMSVideoSearchInput
}

input CampaignDateFilterInput {
  before: Date
  after: Date
}

input AllCampaignsQueryInput {
  customerIds: [ObjectID!] = []
  starting: CampaignDateFilterInput = {}
  ending: CampaignDateFilterInput = {}
}

input SearchCampaignsQueryInput {
  customerIds: [ObjectID!] = []
  starting: CampaignDateFilterInput = {}
  ending: CampaignDateFilterInput = {}
}

input CampaignSortInput {
  field: CampaignSortField! = createdAt
  order: Int! = -1
}

input CreateCampaignInput {
  name: String
  customerId: String!
  maxIdentities: Int
  startDate: Date
  endDate: Date
}

input UpdateCampaignPayloadInput {
  name: String
  customerId: String!
  maxIdentities: Int
  startDate: Date
  endDate: Date
}

input UpdateCampaignInput {
  id: String!
  payload: UpdateCampaignPayloadInput!
}

input EmailCampaignTagsInput {
  id: String!
  tagIds: [String!]
}

input EmailCampaignExcludedTagsInput {
  id: String!
  tagIds: [String!]
}

input EmailCampaignLinkTypesInput {
  id: String!
  linkTypes: [String!]
}

input EmailCampaignExcludedFieldsInput {
  id: String!
  excludeFields: [String!]
}

input CampaignRestrictSentDateInput {
  id: String!
  restrictToSentDate: Boolean!
}

input CampaignDisplayDeliveredMetricsInput {
  id: String!
  displayDeliveredMetrics: Boolean!
}

input EmailCampaignIdentityFiltersInput {
  id: String!
  filters: [EmailCampaignIdentityFilterInput!]!
}

input EmailCampaignIdentityFilterInput {
  key: String!
  label: String!
  matchType: String!
  terms: [String!]!
}

input EmailCampaignExcludedUrlsInput {
  id: String!
  excludeUrls: [EmailCampaignExcludedUrlInput!]!
}

input EmailCampaignExcludedUrlInput {
  urlId: String!
  sendId: String!
  active: Boolean!
}

input FormCampaignExcludedFormsInput {
  id: String!
  excludeForms: [FormCampaignExcludedFormInput!]!
}

input FormCampaignExcludedFormInput {
  formId: String!
  active: Boolean!
}

input AdCampaignTagsInput {
  id: String!
  tagIds: [String!]
}

input AdCampaignExcludedFieldsInput {
  id: String!
  excludeFields: [String!]
}

input AdCampaignIdentityFiltersInput {
  id: String!
  filters: [AdCampaignIdentityFilterInput!]!
}

input AdCampaignIdentityFilterInput {
  key: String!
  label: String!
  matchType: String!
  terms: [String!]!
}

input AdCampaignExcludedTrackersInput {
  id: String!
  excludeTrackerIds: [String!]!
}

input CampaignStatusInput {
  id: String!
  enabled: Boolean!
}

enum CampaignSortField {
  fullName
  createdAt
  updatedAt
}

`;
