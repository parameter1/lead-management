const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  exportStatus(id: String!): Export!
}

extend type Mutation {
  createExport(input: CreateExportMutationInput!): Export!
}

enum ExportStatus {
  pending
  running
  completed
  errored
}

type Export {
  id: String!
  campaign: String!
  action: String!
  status: ExportStatus
  filename: String!
  url: String
}

input CreateExportMutationInput {
  "The export service action to run"
  action: String!
  "The campaign hash this export is for"
  hash: String!
  "The user-facing description of this export"
  name: String!
}

`;
