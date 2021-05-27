const mongoose = require('../mongoose');
const schema = require('../schema/extracted-url');

module.exports = mongoose.model('extracted-url', schema);
