const connection = require('../../connection');
const schema = require('../../schema/omeda/email-deployment-html');

module.exports = connection.model('omeda-email-deployment-html', schema);
