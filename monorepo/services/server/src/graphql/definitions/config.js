const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  currentAppConfig: AppConfig!
}

type AppConfig {
  _id: ObjectID!
  zone: String!
  modules: [AppModuleConfig!]!
}

type AppModuleConfig {
  key: String!
  enabled: Boolean!
}

`;
