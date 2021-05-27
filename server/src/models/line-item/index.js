const mongoose = require('../../mongoose');
const schema = require('../../schema/line-item');

module.exports = mongoose.model('line-item', schema);
