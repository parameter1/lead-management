const connection = require('../connection');
const schema = require('../schema/ad-creative-tracker');

module.exports = connection.model('ad-creative-tracker', schema);
