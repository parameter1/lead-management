const connection = require('../connection');
const schema = require('../schema/campaign');

module.exports = connection.model('campaign', schema);
