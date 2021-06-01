const connection = require('../connection');
const schema = require('../schema/identity');

module.exports = connection.model('identity', schema);
