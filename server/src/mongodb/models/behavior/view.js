const connection = require('../../connection');
const schema = require('../../schema/behavior/view');

module.exports = connection.model('behavior-view', schema);
