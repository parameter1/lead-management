const { AWS_REGION, AWS_ACCOUNT_ID, TENANT_KEY } = require('../../env');

const baseUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}`;

module.exports = ({ name, prefix = `lead-management-${TENANT_KEY}-` }) => `${baseUrl}/${prefix}${name}`;
