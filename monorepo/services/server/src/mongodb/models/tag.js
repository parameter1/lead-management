const connection = require('../connection');
const schema = require('../schema/tag');

module.exports = connection.model('tag', schema);
