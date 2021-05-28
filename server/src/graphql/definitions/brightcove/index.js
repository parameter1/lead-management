const { gql } = require('apollo-server-express');

const analytics = require('./analytics');
const cms = require('./cms');

module.exports = gql`

${analytics}
${cms}

type BrightcovePageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  nextOffset: Int
  previousOffset: Int
}

`;
