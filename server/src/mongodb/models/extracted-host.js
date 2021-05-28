const connection = require('../connection');
const schema = require('../schema/extracted-host');

module.exports = connection.model('extracted-host', schema);
