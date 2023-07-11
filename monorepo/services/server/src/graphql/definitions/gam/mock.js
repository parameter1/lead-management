const { gql } = require('apollo-server-express');

module.exports = (include) => (include ? '' : gql`

scalar GAMBigInt

type GAMCompany {
  id: GAMBigInt!
  name: String
}

type GAMLineItem {
  id: GAMBigInt!
  name: String
}

type GAM_CompanyConnection {
  nodes: [GAMCompany!]!
  pageInfo: GAM_PageInfo!
  statement: GAM_StatementInfo!
  totalCount: Int!
}

type GAM_LineItemConnection {
  nodes: [GAMLineItem!]!
  pageInfo: GAM_PageInfo!
  statement: GAM_StatementInfo!
  totalCount: Int!
}

`);
