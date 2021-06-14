const connection = require('../connection');
const schema = require('../schema/user');

module.exports = connection.model('user', schema);
