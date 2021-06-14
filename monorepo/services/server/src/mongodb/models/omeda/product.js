const connection = require('../../connection');
const schema = require('../../schema/omeda/product');

module.exports = connection.model('omeda-product', schema);
