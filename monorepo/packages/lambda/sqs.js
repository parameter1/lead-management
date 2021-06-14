// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_EXECUTION_ENV,
} = require('./env');

// if there's a lambda execution env, do not use the local env vars when created the sqs client
module.exports = AWS_EXECUTION_ENV ? new AWS.SQS({ apiVersion: '2012-11-05' }) : new AWS.SQS({
  apiVersion: '2012-11-05',
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});
