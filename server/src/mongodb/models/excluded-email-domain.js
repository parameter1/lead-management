const connection = require('../connection');
const schema = require('../schema/excluded-email-domain');

module.exports = connection.model('excluded-email-domain', schema);
