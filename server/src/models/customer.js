const mongoose = require('../mongoose');
const schema = require('../schema/customer');

module.exports = mongoose.model('customer', schema);
