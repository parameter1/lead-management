const connection = require('../../connection');
const schema = require('../../schema/omeda/deployment-type');

module.exports = connection.model('omeda-deployment-type', schema);
