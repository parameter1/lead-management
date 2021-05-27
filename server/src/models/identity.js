const mongoose = require('../mongoose');
const schema = require('../schema/identity');

module.exports = mongoose.model('identity', schema);
