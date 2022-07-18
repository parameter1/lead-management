const connection = require('../connection');
const schema = require('../schema/export');

module.exports = connection.model('export', schema);
