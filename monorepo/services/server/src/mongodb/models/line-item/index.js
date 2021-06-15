const connection = require('../../connection');
const schema = require('../../schema/line-item');

module.exports = connection.model('line-item', schema);
