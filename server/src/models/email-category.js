const mongoose = require('../mongoose');
const schema = require('../schema/email-category');

module.exports = mongoose.model('email-category', schema);
