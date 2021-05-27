const mongoose = require('../mongoose');
const schema = require('../schema/form');

module.exports = mongoose.model('form', schema);
