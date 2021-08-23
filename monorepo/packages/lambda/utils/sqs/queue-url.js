const { AWS_REGION, AWS_ACCOUNT_ID } = require('../../env');

const baseUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}`;

module.exports = ({ name, prefix = 'lead-management-indm-' }) => `${baseUrl}/${prefix}${name}`;
