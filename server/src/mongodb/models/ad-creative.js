const connection = require('../connection');
const schema = require('../schema/ad-creative');

module.exports = connection.model('ad-creative', schema);
