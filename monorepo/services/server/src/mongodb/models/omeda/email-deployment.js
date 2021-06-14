const connection = require('../../connection');
const schema = require('../../schema/omeda/email-deployment');

module.exports = connection.model('omeda-email-deployment', schema);
