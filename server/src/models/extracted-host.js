const mongoose = require('../mongoose');
const schema = require('../schema/extracted-host');

module.exports = mongoose.model('extracted-host', schema);
