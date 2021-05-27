const mongoose = require('../../mongoose');
const schema = require('../../schema/content-query/result');

module.exports = mongoose.model('content-query-result', schema);
