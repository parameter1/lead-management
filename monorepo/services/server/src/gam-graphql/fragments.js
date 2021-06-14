const { gql } = require('apollo-server-express');

const COMPANY_FRAGMENT = gql`
  fragment LeadsCompanyFragment on Company {
    id
    name
    lastModifiedDateTime
  }
`;

module.exports = { COMPANY_FRAGMENT };
