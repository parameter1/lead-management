const connection = require('../connection');
const schema = require('../schema/extracted-url');

module.exports = connection.model('extracted-url', schema);
