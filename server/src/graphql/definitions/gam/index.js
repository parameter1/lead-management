const { gql } = require('apollo-server-express');

const advertiser = require('./advertiser');
const lineItem = require('./line-item');

module.exports = gql`

${advertiser}
${lineItem}

`;
