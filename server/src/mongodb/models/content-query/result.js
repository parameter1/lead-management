const connection = require('../../connection');
const schema = require('../../schema/content-query/result');

module.exports = connection.model('content-query-result', schema);
