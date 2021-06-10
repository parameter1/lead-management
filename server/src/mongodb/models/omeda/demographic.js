const connection = require('../../connection');
const schema = require('../../schema/omeda/demographic');

module.exports = connection.model('omeda-demographic', schema);
