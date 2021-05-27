const mongoose = require('../mongoose');
const schema = require('../schema/email-send');

module.exports = mongoose.model('email-send', schema);
