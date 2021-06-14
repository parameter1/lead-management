const connection = require('../../connection');
const schema = require('../../schema/omeda/email-deployment-url');

module.exports = connection.model('omeda-email-deployment-url', schema);
