const mongoose = require('../mongoose');
const schema = require('../schema/order');

module.exports = mongoose.model('order', schema);
