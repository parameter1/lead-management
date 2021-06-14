const connection = require('../connection');
const schema = require('../schema/order');

module.exports = connection.model('order', schema);
