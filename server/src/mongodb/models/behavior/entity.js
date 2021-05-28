const connection = require('../../connection');
const schema = require('../../schema/behavior/entity');

module.exports = connection.model('behavior-entity', schema);
