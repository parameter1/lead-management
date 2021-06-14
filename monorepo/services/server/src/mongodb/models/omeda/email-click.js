const connection = require('../../connection');
const schema = require('../../schema/omeda/email-click');

module.exports = connection.model('omeda-email-click', schema);
