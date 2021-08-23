const connection = require('../connection');
const schema = require('../schema/tracked-html');

module.exports = connection.model('tracked-html', schema);
