const connection = require('../connection');
const schema = require('../schema/customer');

module.exports = connection.model('customer', schema);
